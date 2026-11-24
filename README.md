# Actualizer, version 1.4.0: (March 20, 2025)
This is WEB application based on Apps from Gurtam (http://apps.wialon.com).

**This is a legacy app: it is no longer developed or maintained. The code is published as is, without support.**

## Description
"Actualizer" is an application that allows you to detect "dead units", i.e., units that have not sent any data for a long period. Unit's activity is estimated according to the time of the last message received from it.

At launching, all available units are displayed in the order beginning from the most 'inactive' one. For your convenience, information about the last message is represented simultaneously in two forms: (1) date and time of the message and (2) how many days ago.

The list of units can be sorted by last message time as well as by name. Furthermore, filtration by days can be applied, i.e., you can get a list of units not sending data for N and more days.

## License
[The MIT License](LICENSE-MIT)

## Requirements
 * Browser: a current version of Google Chrome, Firefox, Safari or Edge
 * Language: en, br, cs, es, fa, fi, fr, it, pl, ru, sk, sq, uk
 * Components: SDK
 * URL params: Active SID, Base URL, Host URL, Language, Current user

## Quick start
Apps activation through the management system: https://help.wialon.com/en/wialon-hosting/user-guide/management-system/apps  
Working with applications in the GPS tracking system: https://help.wialon.com/en/wialon-hosting/user-guide/monitoring-system/apps

## Installation
The repository contains the app in the form it is hosted in. Put the files on a web server and open `index.html` with the URL params listed above, for example
`index.html?sid=<Active SID>&baseUrl=https://hst-api.wialon.com&user=<Current user>&lang=en`.

 * On start the page requests `/actualizer/app/app.json` and the optional `/actualizer/whitelabel.json` (white label settings) by absolute paths, so host the app under the `/actualizer/` path to have them picked up.
