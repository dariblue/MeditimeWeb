import re

with open('pages/recordatorios.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract med-modal
med_modal_pattern = re.compile(r'<!-- Modal para añadir/editar medicamento \(API v2\.0\) -->(.*?)<!-- Modal de confirmación para eliminar -->', re.DOTALL)
med_modal_match = med_modal_pattern.search(html)

if med_modal_match:
    med_modal_str = "<!-- Modal para añadir/editar medicamento (API v2.0) -->" + med_modal_match.group(1)
    # Remove from original
    html = html.replace(med_modal_str, '')
else:
    print("Could not find med-modal")
    med_modal_str = ""

# Extract confirm-modal
confirm_modal_pattern = re.compile(r'<!-- Modal de confirmación para eliminar -->(.*?)<!-- Scripts -->', re.DOTALL)
confirm_modal_match = confirm_modal_pattern.search(html)

if confirm_modal_match:
    confirm_modal_str = "<!-- Modal de confirmación para eliminar -->" + confirm_modal_match.group(1)
    # Remove from original
    html = html.replace(confirm_modal_str, '')
else:
    print("Could not find confirm-modal")
    confirm_modal_str = ""

# Insert both before Scripts
if med_modal_str or confirm_modal_str:
    insertion_point = "    <!-- Scripts -->"
    html = html.replace(insertion_point, med_modal_str + "\n" + confirm_modal_str + "\n" + insertion_point)
    
    with open('pages/recordatorios.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully moved modals to the bottom.")
else:
    print("No changes made.")
