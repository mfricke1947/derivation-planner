# Third-party notices

Derivation Planner (Deriver) is released under the MIT licence (see `LICENSE`). It bundles the following third-party software,
which keeps its own licence. Where a component is offered under more than one licence, it is used here under the permissive one.

| Component | Where | Licence | Notes |
|---|---|---|---|
| **Electron** (with Node.js and Chromium) | the application shell | MIT (Electron, Node.js); Chromium and its components under their own licences | Packaged builds contain `LICENSE.electron.txt` and `LICENSES.chromium.html` listing them in full. |
| **Google Web Toolkit (GWT) runtime** | inside every compiled widget (`widgets/war`, `vendor/symbolize13`) | Apache License 2.0 | Compiled GWT output embeds the GWT runtime. https://www.gwtproject.org |
| **SVG-edit 2.6** (modified copy) | `widgets/war/svg-edit-2.6-hackCopy` | MIT, © 2010 Alexis Deveria, Pavol Rusnak and contributors | The drawing editor behind the Interpretations tab, with additions for logic diagrams (`extensionsMF/`). |
| **canvg** | `…/svg-edit-2.6-hackCopy/canvg` | MIT | |
| **jPicker** | `…/jgraduate/jpicker.js` | MIT-style licence, © 2010 Christopher T. Tillman | |
| **jGraduate** | `…/jgraduate` | Apache License 2.0 (see `jgraduate/LICENSE`) | |
| **jQuery 1.7.1** | `…/jquery.js` | MIT or GPL v2 (dual); used under MIT | https://jquery.org/license |
| **jQuery UI 1.8.x** | `…/jquery-ui` | MIT or GPL v2 (dual); used under MIT | |
| **jQuery hotkeys** | `…/js-hotkeys` | MIT or GPL v2 (dual), © 2010 John Resig; used under MIT | |
| **jQuery contextMenu** | `…/contextmenu` | MIT or GPL (dual), © A Beautiful Site, LLC; used under MIT | |
| **jQuery BBQ** | `…/jquerybbq` | MIT or GPL (dual), © 2010 "Cowboy" Ben Alman; used under MIT | |
| **JQuerySpinBtn** | `…/spinbtn` | no licence statement in the file | Originally by George Adamson and Mark Gibson; distributed with SVG-edit. *To be confirmed by the maintainer.* |
| **JScheme** | inside the Symbolize widget (`vendor/symbolize13`, source package `jscheme`) | Peter Norvig's software licence, http://www.norvig.com/license.html | Permits use, modification and redistribution with no warranty; the origin must not be misrepresented and altered versions must be plainly marked as such. © 1998-2002 Peter Norvig. |

## MIT licence text (applies to the MIT-licensed components above, each with its own copyright holder)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files
(the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions: the above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR
ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH
THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Apache License 2.0

The full text is at https://www.apache.org/licenses/LICENSE-2.0 and, for jGraduate, in `widgets/war/svg-edit-2.6-hackCopy/jgraduate/LICENSE`.

## Acknowledgement

Derivation Planner was developed by Martin Frické, with software implementation, debugging and testing carried out with the assistance of
Claude Code (Anthropic), an AI coding assistant, under the author's direction. The author warmly thanks Claude and Anthropic.
