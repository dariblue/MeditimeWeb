import os
import glob

html_files = glob.glob('**/*.html', recursive=True)

favicon_tag = '    <link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico">\n'

for file_path in html_files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Avoid duplicating
    if 'rel="icon"' in content and 'favicon.ico' in content:
        continue
        
    # Remove old favicon links if they exist (just in case)
    # Actually it's safer to just insert it if 'favicon.ico' is not found
    
    if '</head>' in content:
        content = content.replace('</head>', favicon_tag + '</head>')
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")
