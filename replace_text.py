import glob

files = glob.glob('**/*.html', recursive=True)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    if 'Mis Recordatorios' in content:
        content = content.replace('Mis Recordatorios', 'Mis Medicamentos')
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file}")
