import sys

with open('src/components/common/Layout.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix escaped braces from PowerShell regex substitution
content = content.replace(
    r'  const \{ members: allMembers, teams: allTeams \} = useClubData();',
    '  const { members: allMembers, teams: allTeams } = useClubData();'
)
content = content.replace(
    r'  const allData = \{ members: allMembers, teams: allTeams \};',
    '  const allData = { members: allMembers, teams: allTeams };'
)
# Fix comment encoding artifact (various possible encodings)
for bad in [
    '  // Consume shared context \xa2\xef\xbf\xbdno local fetch needed',
    '  // Consume shared context ?\u201c no local fetch needed',
    '  // Consume shared context \ufffd\u201c no local fetch needed',
]:
    content = content.replace(bad, '  // Consume shared context — no local fetch needed')

with open('src/components/common/Layout.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('done')
