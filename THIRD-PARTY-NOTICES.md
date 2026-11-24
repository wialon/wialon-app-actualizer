# Third-party notices

This repository is distributed under the MIT License (see `LICENSE-MIT`). That licence applies to the code written by Gurtam. The components listed below are third-party software included in the repository; they remain under their own licences, which are named in each entry and reproduced at the end of this file.

## Third-party components

### jQuery 1.10.2

- Where: `js/jquery-1.10.2.min.js`
- Project: https://jquery.com/
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notices:
  - (c) 2005, 2013 jQuery Foundation, Inc.
  - Copyright 2013 jQuery Foundation and other contributors, http://jquery.com/

### jQuery UI 1.10.3 (custom build: core, widget, mouse, slider)

- Where: `js/jquery-ui-1.10.3.custom.min.js`; `css/jquery-ui-1.10.3.custom.css`
- Project: http://jqueryui.com
- Licence: MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Copyright 2013 jQuery Foundation and other contributors

### Localisation assistance for jQuery 1.1.0 (jquery.localisation)

- Where: `js/jquery.localisation.js`
- Project: http://keith-wood.name/localisation.html
- Licence: dual-licensed by its author under the MIT License or the GPL; used here under the MIT License (SPDX: MIT). Text: see "MIT License" below.
- Copyright notice: Written by Keith Wood (kbwood{at}iinet.com.au) June 2007.
- Note: Modified by Gurtam: the plugin loads the translations as JSON files (`<package>-<lang>.json`) into a global `TRANSLATIONS` object instead of loading scripts.

## Licence texts

### MIT License

The following text applies to every component above that refers to the MIT License; the copyright notice of each component is given in its entry.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Libraries loaded at run time

At run time the app also loads some libraries from the network (for example the Wialon JavaScript SDK). They are not part of this repository and are not covered by this file.
