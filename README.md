# n8n-nodes-pagedpdf

This is an n8n community node. It lets you use [PagedPDF](https://pagedpdf.com) in your n8n workflows to turn HTML into PDFs.

PagedPDF is an HTML to PDF API that prints with current Chrome and fixes the problems Chrome has on its own: table rows stay whole at page breaks, table headers repeat on every page, page numbers take one option, and the response tells you when a font or image didn't load. It works on n8n Cloud, where there's no browser to run Puppeteer.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, and install `n8n-nodes-pagedpdf`.

## Operations

**Convert HTML to PDF** sends an HTML document to PagedPDF and returns the PDF as a binary file, ready for an email, Google Drive, S3 or an HTTP response node. It takes these options:

| Option | What it does |
|---|---|
| Paper Size | A3, A4 (the default), A5, Legal, Letter or Tabloid. A CSS `@page` size in your HTML takes priority. |
| Landscape | Turns the page sideways. |
| Margin Top, Right, Bottom, Left | A length such as `15mm`, `1cm`, `0.5in` or `24px`. The defaults are 15mm top and bottom, 12mm left and right. |
| Header, Footer | Plain text on every page, such as `Page {page} of {pages}`. |
| Base URL | Relative URLs for images, fonts and stylesheets resolve against this, and it counts as the page's origin. |
| Run JavaScript | Runs the page's scripts first, for documents built with JavaScript. Off by default. |
| Table Fixes | Keeps table rows whole and repeats table headers on every page. On by default. |

Each output item has the PDF in the binary field you choose (`data` by default) and these JSON fields:

| Field | Meaning |
|---|---|
| `pages` | Pages in the PDF. |
| `warningCount`, `warnings` | Anything that didn't load or print as expected, such as a relative image URL with no base URL, a font blocked by its server, or a table header too tall to repeat. Each warning has a `code`, a `url` and a `message`. |
| `usedThisMonth`, `monthlyLimit` | Your plan's usage after this PDF. |

If the API refuses a request, for example because a margin isn't a valid length or the monthly limit is reached, the node fails with PagedPDF's own error message. With **On Error > Continue**, it outputs an item with an `error` field instead.

## Credentials

You need a PagedPDF API key. Get a free one at [pagedpdf.com](https://pagedpdf.com): enter your email and you'll get a link to your key. The free plan makes 50 PDFs a month, and paid plans start at 2,000 a month.

In n8n, create a **PagedPDF API** credential and paste the key. Saving it checks the key against PagedPDF's usage endpoint, which doesn't use up a document.

## Compatibility

Tested with n8n 2.47.7. The node has no runtime dependencies.

## Usage

A common workflow builds an invoice from your data and emails it:

1. Get the order data, for example from a webhook or a Google Sheets row.
2. Build the HTML in a **Code** or **HTML** node. Put the line items in a `<table>` with the header row in `<thead>`, and PagedPDF keeps rows whole and repeats the header on each page.
3. Add the **PagedPDF** node with `{{ $json.html }}` in the HTML field and `Page {page} of {pages}` as the footer.
4. Send the `data` binary field with **Gmail**, **Send Email** or **Google Drive**.

Images and fonts need absolute URLs, `data:` URIs, or a Base URL. If something doesn't load, the `warnings` field says which file and why, so an **If** node on `warningCount` can catch it before the PDF goes out.

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [PagedPDF API docs](https://pagedpdf.com/docs/)
* [PagedPDF guides](https://pagedpdf.com/guides/), on table page breaks, page numbers and fonts

## Version history

**0.1.0**: first release, with the Convert HTML to PDF operation.
