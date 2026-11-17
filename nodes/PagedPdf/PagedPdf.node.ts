import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const header = (headers: IDataObject, name: string): string | undefined => {
	const value = headers[name];
	return Array.isArray(value) ? String(value[0]) : value === undefined ? undefined : String(value);
};

export class PagedPdf implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'PagedPDF',
		name: 'pagedPdf',
		icon: { light: 'file:pagedpdf.svg', dark: 'file:pagedpdf.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: 'HTML to PDF',
		description: 'Turn HTML into a PDF with whole table rows, repeating headers and page numbers',
		defaults: {
			name: 'PagedPDF',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'pagedPdfApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Convert HTML to PDF',
						value: 'htmlToPdf',
						action: 'Convert HTML to PDF',
						description: 'Print an HTML document to a PDF file',
					},
				],
				default: 'htmlToPdf',
			},
			{
				displayName: 'HTML',
				name: 'html',
				type: 'string',
				typeOptions: { rows: 8 },
				default: '',
				required: true,
				placeholder: '<h1>Invoice 1042</h1>',
				description: 'The HTML document to print. The whole request can be up to 20 MB.',
			},
			{
				displayName: 'Put Output File in Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				description: 'The name of the output binary field to put the PDF in',
			},
			{
				displayName: 'File Name',
				name: 'fileName',
				type: 'string',
				default: 'document.pdf',
				description: 'The file name to give the PDF',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add option',
				default: {},
				options: [
					{
						displayName: 'Base URL',
						name: 'baseUrl',
						type: 'string',
						default: '',
						placeholder: 'https://www.example.com/',
						description:
							"Relative URLs for images, fonts and stylesheets resolve against this. It also counts as the page's origin, so fonts on that site need no CORS headers.",
					},
					{
						displayName: 'Footer',
						name: 'footer',
						type: 'string',
						default: '',
						placeholder: 'Page {page} of {pages}',
						description:
							'Text printed at the bottom of every page, up to 500 characters. {page} and {pages} become the page number and the page count.',
					},
					{
						displayName: 'Header',
						name: 'header',
						type: 'string',
						default: '',
						placeholder: 'Invoice 1042',
						description:
							'Text printed at the top of every page, up to 500 characters. {page} and {pages} work here too.',
					},
					{
						displayName: 'Landscape',
						name: 'landscape',
						type: 'boolean',
						default: false,
						description: 'Whether to turn the page sideways',
					},
					{
						displayName: 'Margin Bottom',
						name: 'marginBottom',
						type: 'string',
						default: '',
						placeholder: '15mm',
						description: 'A length in mm, cm, in or px. Leave empty for the default of 15mm.',
					},
					{
						displayName: 'Margin Left',
						name: 'marginLeft',
						type: 'string',
						default: '',
						placeholder: '12mm',
						description: 'A length in mm, cm, in or px. Leave empty for the default of 12mm.',
					},
					{
						displayName: 'Margin Right',
						name: 'marginRight',
						type: 'string',
						default: '',
						placeholder: '12mm',
						description: 'A length in mm, cm, in or px. Leave empty for the default of 12mm.',
					},
					{
						displayName: 'Margin Top',
						name: 'marginTop',
						type: 'string',
						default: '',
						placeholder: '15mm',
						description: 'A length in mm, cm, in or px. Leave empty for the default of 15mm.',
					},
					{
						displayName: 'Paper Size',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'A3', value: 'A3' },
							{ name: 'A4', value: 'A4' },
							{ name: 'A5', value: 'A5' },
							{ name: 'Legal', value: 'Legal' },
							{ name: 'Letter', value: 'Letter' },
							{ name: 'Tabloid', value: 'Tabloid' },
						],
						default: 'A4',
						description: 'A CSS @page size in the document takes priority',
					},
					{
						displayName: 'Run JavaScript',
						name: 'javascript',
						type: 'boolean',
						default: false,
						description:
							"Whether to run the page's scripts before printing, for documents that build their content with JavaScript",
					},
					{
						displayName: 'Table Fixes',
						name: 'tableFixes',
						type: 'boolean',
						default: true,
						description:
							'Whether to keep table rows whole and repeat table headers on every page',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const credentials = await this.getCredentials('pagedPdfApi');
		const baseUrl = String(credentials.baseUrl ?? 'https://api.pagedpdf.com').replace(/\/+$/, '');

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const html = this.getNodeParameter('html', itemIndex) as string;
			const binaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
			const fileName = this.getNodeParameter('fileName', itemIndex, 'document.pdf') as string;
			const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

			// Each failure becomes an n8n error, which either stops the workflow or, with
			// "Continue On Fail", becomes an error item for that input.
			const fail = (failure: NodeApiError | NodeOperationError) => {
				if (!this.continueOnFail()) throw failure;
				returnData.push({ json: { error: failure.message }, pairedItem: { item: itemIndex } });
			};

			if (!html.trim()) {
				fail(new NodeOperationError(this.getNode(), 'The HTML field is empty', { itemIndex }));
				continue;
			}

			const body: IDataObject = { html };
			for (const name of ['format', 'landscape', 'header', 'footer', 'javascript'] as const) {
				if (options[name] !== undefined && options[name] !== '') body[name] = options[name];
			}
			if (options.baseUrl) body.base_url = options.baseUrl;
			if (options.tableFixes !== undefined) body.table_fixes = options.tableFixes;
			const margin: IDataObject = {};
			for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
				const value = options[`margin${side}`];
				if (value) margin[side.toLowerCase()] = value;
			}
			if (Object.keys(margin).length) body.margin = margin;

			const request: IHttpRequestOptions = {
				method: 'POST',
				url: `${baseUrl}/v1/pdf`,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
				encoding: 'arraybuffer',
				returnFullResponse: true,
				ignoreHttpStatusErrors: true,
				timeout: 120000,
			};
			let response;
			try {
				response = await this.helpers.httpRequestWithAuthentication.call(this, 'pagedPdfApi', request);
			} catch (error) {
				fail(new NodeApiError(this.getNode(), error as JsonObject, { itemIndex }));
				continue;
			}
			const data = Buffer.from(response.body as ArrayBuffer);
			const headers = response.headers as IDataObject;

			if (response.statusCode !== 200) {
				let message = `PagedPDF returned HTTP ${response.statusCode}`;
				let code: string | undefined;
				try {
					const parsed = JSON.parse(data.toString('utf8')) as { error?: { code?: string; message?: string } };
					message = parsed.error?.message ?? message;
					code = parsed.error?.code;
				} catch {
					// Not JSON, so keep the status message.
				}
				fail(
					new NodeApiError(this.getNode(), { code, message } as JsonObject, {
						itemIndex,
						message,
						httpCode: String(response.statusCode),
					}),
				);
				continue;
			}

			let warnings: unknown = [];
			try {
				warnings = JSON.parse(header(headers, 'x-pagedpdf-warnings') ?? '[]');
			} catch {
				warnings = [];
			}
			const number = (name: string) => {
				const value = header(headers, name);
				return value === undefined ? undefined : Number(value);
			};

			returnData.push({
				json: {
					fileName,
					pages: number('x-pagedpdf-pages'),
					warningCount: number('x-pagedpdf-warning-count') ?? 0,
					warnings,
					usedThisMonth: number('x-pagedpdf-used'),
					monthlyLimit: number('x-pagedpdf-limit'),
				} as IDataObject,
				binary: {
					[binaryPropertyName]: await this.helpers.prepareBinaryData(data, fileName, 'application/pdf'),
				},
				pairedItem: { item: itemIndex },
			});
		}

		return [returnData];
	}
}
