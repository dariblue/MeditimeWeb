import os
import glob
import re

def remove_pages_path(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # Remove pages/ from href
    new_content = re.sub(
        r'href="(/?)pages/([^"]+)"',
        r'href="\1\2"',
        new_content
    )

    # Remove pages/ from window.location.href
    new_content = re.sub(
        r'(window\.location\.href\s*=\s*[\'"])(/?)pages/([^\'"]+)([\'"])',
        r'\1\2\3\4',
        new_content
    )

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Removed pages/ from {filepath}")

# Process HTML files
html_files = glob.glob('*.html') + glob.glob('pages/*.html')
for html_file in html_files:
    remove_pages_path(html_file)

# Process JS files
js_files = glob.glob('assets/js/**/*.js', recursive=True) + glob.glob('sw.js')
for js_file in js_files:
    remove_pages_path(js_file)

