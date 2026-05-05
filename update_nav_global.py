import os
import glob
import re

def update_footer_and_all(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content

    # Contacto
    new_content = re.sub(
        r'<li>\s*<a([^>]*)href="([^"]*contacto\.html)"([^>]*)>Contacto</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a\1href="\2"\3>Contacto</a></li>',
        new_content
    )

    # FAQ
    new_content = re.sub(
        r'<li>\s*<a([^>]*)href="([^"]*faq\.html)"([^>]*)>FAQ</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a\1href="\2"\3>FAQ</a></li>',
        new_content
    )
    
    # Preguntas frecuentes (which links to FAQ)
    new_content = re.sub(
        r'<li>\s*<a([^>]*)href="([^"]*faq\.html)"([^>]*)>Preguntas frecuentes</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a\1href="\2"\3>Preguntas frecuentes</a></li>',
        new_content
    )

    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

html_files = glob.glob('*.html') + glob.glob('pages/*.html')
for html_file in html_files:
    update_footer_and_all(html_file)
