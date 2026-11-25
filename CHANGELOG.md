# Changelog

## 0.1.2

README links to the n8n invoice PDF guide and its importable workflow template, and the package has two more search keywords. The node and credential are unchanged. This is the first version published through npm trusted publishing (GitHub Actions OIDC) instead of a token, staged and then approved on npmjs.com.

0.1.1 was tagged with the same content but never reached npm: its workflow ran a plain `npm publish`, which the stage-only trusted publisher refuses.

## 0.1.0

First release: the PagedPDF node with the Convert HTML to PDF operation, and the PagedPDF API credential.
