#!/usr/bin/env python3
"""
Assembles build-map.html by injecting JS libraries and app code into the HTML template.
Replaces placeholder comments with actual file contents.
"""
import os

# Absolute paths pointing back to the artifacts workspace scratch space
SCRATCH = '/home/deadpool/.gemini/antigravity-cli/brain/428b440f-fe07-4760-8076-f4231965bcf2/scratch'
LIBS = os.path.join(SCRATCH, 'libs')
OUTPUT = '/home/deadpool/omniverse/paysoft/app/content/visuals/build-map.html'

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def main():
    template = read(os.path.join(SCRATCH, 'build-map-template.html'))
    dagre = read(os.path.join(LIBS, 'dagre.min.js'))
    cytoscape_js = read(os.path.join(LIBS, 'cytoscape.min.js'))
    cytoscape_dagre = read(os.path.join(LIBS, 'cytoscape-dagre.js'))
    app = read(os.path.join(SCRATCH, 'build-map-app.js'))

    # Replace placeholders
    html = template
    html = html.replace('/* __DAGRE_JS__ */', dagre)
    html = html.replace('/* __CYTOSCAPE_JS__ */', cytoscape_js)
    html = html.replace('/* __CYTOSCAPE_DAGRE_JS__ */', cytoscape_dagre)
    html = html.replace('/* __APP_JS__ */', app)

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        f.write(html)

    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f'✓ Assembled build-map.html ({size_kb:.0f} KB)')
    print(f'  → {OUTPUT}')

if __name__ == '__main__':
    main()
