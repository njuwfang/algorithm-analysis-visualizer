# Analysis of Algorithms — Interactive Lab

A dependency-free teaching companion for the lecture deck **03_Analysis_of_Algorithms.pdf**. It keeps the deck's analytical sequence visible:

1. choose the input-size parameter;
2. identify the basic operation;
3. consider best, average, and worst cases;
4. count the basic operation with a sum or recurrence;
5. state the order of growth.

The site contains five interactive modules:

- Maximum element
- Element uniqueness
- Number of binary digits — iterative
- Tower of Hanoi — guided recursive solution and practice puzzle
- Number of binary digits — recursive

Everything runs in the browser. There is no build step, package manager, framework, analytics script, or external CDN.

## Quick start in WSL

Open WSL, extract the project, and run a small local web server:

```bash
cd /path/to/analysis-visualizer
./serve.sh
```

Then open this address in your Windows browser:

```text
http://localhost:8080
```

`localhost` normally works directly with WSL 2. If it does not, find the WSL address with:

```bash
hostname -I
```

Then open `http://<that-address>:8080`.

To stop the server, return to the WSL terminal and press `Ctrl+C`.

### Optional Node-based server

Node is not required, but either of these also works:

```bash
npx serve .
```

or

```bash
npx http-server .
```

Those commands may download a package the first time. The included `serve.sh` script uses Python and does not require a project dependency.

## Project structure

```text
analysis-visualizer/
├── index.html                  Main page
├── standalone.html            One-file version for direct upload
├── styles.css                 Responsive layout and visualizations
├── app.js                     Algorithms, traces, controls, and rendering
├── favicon.svg                Browser tab icon
├── serve.sh                   One-command WSL development server
├── embed-example.html         Example iframe integration
├── README.md                  This guide
├── .nojekyll                  GitHub Pages compatibility
└── .github/workflows/
    └── deploy-pages.yml       Optional GitHub Pages deployment
```

All asset paths are relative, so the folder can be hosted at a domain root or under a subdirectory.

## Fastest deployment: upload one file

`standalone.html` contains the HTML, CSS, JavaScript, and icon in one file. Rename it to a suitable page name, upload it to your website, and link to it directly. Use the multi-file version when you want easier customization or iframe examples.

## Put it inside an existing personal website

Copy the entire folder into the directory your site publishes. Typical examples:

```text
my-website/public/algorithm-lab/
my-website/static/algorithm-lab/
my-website/docs/algorithm-lab/
```

After the site is deployed, the visualizer will be available at a URL such as:

```text
https://example.com/algorithm-lab/
```

Do not copy only `index.html`; it also needs `styles.css` and `app.js` beside it.

### Link to a particular algorithm

Each module has a stable hash URL:

```text
/algorithm-lab/#max-element
/algorithm-lab/#unique-element
/algorithm-lab/#binary-iterative
/algorithm-lab/#hanoi
/algorithm-lab/#binary-recursive
```

You can link from a slide, lesson page, or LMS directly to the relevant module.

## Embed one module in a page

Use `embed=1` to hide the site header and nonessential navigation. Select a module either with a query parameter or hash.

```html
<iframe
  src="/algorithm-lab/?embed=1&module=hanoi"
  title="Tower of Hanoi interactive visualization"
  width="100%"
  height="820"
  loading="lazy"
  style="border:0; border-radius:16px;"
></iframe>
```

Available module values:

```text
max-element
unique-element
binary-iterative
hanoi
binary-recursive
```

See `embed-example.html` for a complete example.

## Deploy with GitHub Pages

### Option A: deploy from a branch

1. Create a GitHub repository.
2. Put these files at the repository root.
3. Push the repository.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Choose the branch and the `/ (root)` folder.

The included `.nojekyll` file makes GitHub Pages serve the static files without Jekyll processing.

### Option B: use the included GitHub Actions workflow

The file `.github/workflows/deploy-pages.yml` deploys the repository as a static Pages site.

1. In **Settings → Pages**, select **GitHub Actions** as the source.
2. Push to the `main` branch.
3. Open the **Actions** tab to watch the deployment.

If your default branch has a different name, edit the `branches` entry in the workflow.

## Deploy with Netlify, Cloudflare Pages, or Vercel

This is a plain static site.

- **Build command:** leave empty
- **Output/publish directory:** `.`
- **Framework preset:** none / other / static HTML

Upload the folder directly, or connect the Git repository. No environment variables are required.

## Deploy with a conventional web server

Copy the directory under the web root.

For Nginx, a typical target could be:

```bash
sudo mkdir -p /var/www/html/algorithm-lab
sudo cp -r ./* /var/www/html/algorithm-lab/
```

For Apache, use the equivalent directory under `DocumentRoot`.

The visualizer does not need server-side routing, a database, PHP, or Node in production.

## Customize the teaching content

### Change prepared inputs

In `app.js`, find the relevant module in the `modules` array. Edit `defaultInput` and `presets`:

```js
defaultInput: "4, 7, 2, 9, 5",
presets: [
  { label: "Mixed", value: "4, 7, 2, 9, 5" },
  { label: "Descending", value: "9, 7, 5, 3, 1" }
]
```

### Change pseudocode wording

Edit the module's `pseudocode` array. Set `basic: true` on the line that contains the operation being counted.

```js
pseudocode: [
  { line: 1, text: "max ← A[0]" },
  { line: 2, text: "for i ← 1 to n − 1 do" },
  { line: 3, text: "if A[i] > max", indent: 1, basic: true }
]
```

### Change formulas and checklist language

Each module contains a `formula` function and a `checklist` array. Those are the best places to align terminology with future versions of your slides.

### Change colors and spacing

Edit the custom properties at the top of `styles.css`:

```css
:root {
  --brand: #0f5d73;
  --accent: #e78f2f;
  --success: #2c7a59;
  --danger: #b83a42;
}
```

## Classroom controls

- **Previous / Next:** move one trace state at a time.
- **Play / Pause:** run the trace automatically.
- **Speed:** change the automatic-play delay.
- **Reset:** return to the initial state.
- **Left / Right arrow keys:** step while focus is not inside a form control.
- **Space:** play or pause while focus is not inside a form control.
- **Tower practice:** select a source peg and then a destination peg; illegal moves are rejected.

## A note about integer division

The binary-digit modules visualize division by 2 as integer division for positive integers. This makes the execution concrete for inputs that are not powers of two, while the recursive mathematical panel preserves the deck's `n = 2^k` substitution case.

## Test before publishing

Run the local server and check:

1. every module opens;
2. Previous, Next, Play, Pause, and Reset work;
3. invalid input produces a readable error;
4. Tower practice rejects a larger disk on a smaller disk;
5. the page remains usable at phone and projector widths;
6. your deployed URL serves `styles.css` and `app.js` without 404 errors.

A blank or unstyled page after deployment usually means the three main files were not copied into the same directory.
