import os
import glob
import re

def remove_html_ext_from_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # Remove .html from href="..."
    # We only want to remove .html if it is an internal link. Internal links might look like:
    # href="index.html", href="/pages/login.html", href="../pages/faq.html"
    # We avoid external links starting with http:// or https://
    new_content = re.sub(
        r'href="(?!http)([^"]+)\.html"',
        r'href="\1"',
        new_content
    )

    # Remove .html from window.location.href = '...'
    new_content = re.sub(
        r'(window\.location\.href\s*=\s*[\'"])(?!http)([^\'"]+)\.html([\'"])',
        r'\1\2\3',
        new_content
    )

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Removed .html extensions in {filepath}")

# Process HTML files
html_files = glob.glob('*.html') + glob.glob('pages/*.html')
for html_file in html_files:
    remove_html_ext_from_file(html_file)

# Process JS files
js_files = glob.glob('assets/js/**/*.js', recursive=True) + glob.glob('sw.js')
for js_file in js_files:
    remove_html_ext_from_file(js_file)

