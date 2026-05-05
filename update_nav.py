import os
import glob
import re

def update_nav(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the <ul class="nav-links"> block
    nav_links_match = re.search(r'<ul class="nav-links">(.*?)</ul>', content, re.DOTALL)
    if not nav_links_match:
        return

    nav_block = nav_links_match.group(1)
    new_nav_block = nav_block

    # Replace Contacto
    new_nav_block = re.sub(
        r'<li>\s*<a[^>]*href="([^"]*contacto\.html)"[^>]*>Contacto</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a href="\1">Contacto</a></li>',
        new_nav_block
    )

    # Replace FAQ
    new_nav_block = re.sub(
        r'<li>\s*<a[^>]*href="([^"]*faq\.html)"[^>]*>FAQ</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a href="\1">FAQ</a></li>',
        new_nav_block
    )

    # Note: If the a tag has class="active", we should preserve it if needed.
    # Let's handle active tags too just in case.
    new_nav_block = re.sub(
        r'<li>\s*<a([^>]*)href="([^"]*contacto\.html)"([^>]*)>Contacto</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a\1href="\2"\3>Contacto</a></li>',
        new_nav_block
    )
    new_nav_block = re.sub(
        r'<li>\s*<a([^>]*)href="([^"]*faq\.html)"([^>]*)>FAQ</a>\s*</li>',
        r'<li class="nav-auth-only" style="display: none;"><a\1href="\2"\3>FAQ</a></li>',
        new_nav_block
    )

    if nav_block != new_nav_block:
        content = content.replace(nav_block, new_nav_block)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

html_files = glob.glob('*.html') + glob.glob('pages/*.html')
for html_file in html_files:
    update_nav(html_file)

