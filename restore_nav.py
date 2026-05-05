import os
import glob
import re

def restore_nav_links(filepath):
    # Only process if it's NOT index.html
    if 'index.html' in filepath:
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    
    # Restore Contacto
    new_content = re.sub(
        r'<li class="nav-auth-only" style="display: none;">(<a[^>]*>Contacto</a>)</li>',
        r'<li>\1</li>',
        new_content
    )

    # Restore FAQ
    new_content = re.sub(
        r'<li class="nav-auth-only" style="display: none;">(<a[^>]*>FAQ</a>)</li>',
        r'<li>\1</li>',
        new_content
    )
    
    # Restore Preguntas frecuentes
    new_content = re.sub(
        r'<li class="nav-auth-only" style="display: none;">(<a[^>]*>Preguntas frecuentes</a>)</li>',
        r'<li>\1</li>',
        new_content
    )

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Restored nav links in {filepath}")

# Process all HTML files in pages directory
html_files = glob.glob('pages/*.html')
for html_file in html_files:
    restore_nav_links(html_file)

