import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PagedPdfApi implements ICredentialType {
	name = 'pagedPdfApi';

	displayName = 'PagedPDF API';

	icon: Icon = { light: 'file:../icons/pagedpdf.svg', dark: 'file:../icons/pagedpdf.dark.svg' };

	documentationUrl = 'https://github.com/codynaut/n8n-nodes-pagedpdf?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your PagedPDF API key. A free key for 50 PDFs a month is at https://pagedpdf.com.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'hidden',
			default: 'https://api.pagedpdf.com',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	// GET /v1/usage checks the key without using up a document.
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/v1/usage',
			method: 'GET',
		},
	};
}
