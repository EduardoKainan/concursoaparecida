import { cp, mkdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const output = join(root, 'dist');
const requiredFiles = ['index.html', 'styles.css', 'favicon.svg', 'src/app.js', 'src/catalog.json', 'src/lessons.json', 'src/past-exams.json'];

for (const file of requiredFiles) await stat(join(root, file));
const catalog = JSON.parse(await readFile(join(root, 'src/catalog.json'), 'utf8'));
const lessonData = JSON.parse(await readFile(join(root, 'src/lessons.json'), 'utf8'));
const pastExamData = JSON.parse(await readFile(join(root, 'src/past-exams.json'), 'utf8'));
if (!catalog.exam?.sourceUrl || catalog.positions?.length !== 1) {
  throw new Error('Catálogo inválido: fonte oficial ou cargo piloto não encontrado.');
}
if (!Array.isArray(lessonData.lessons)) throw new Error('Aulas inválidas: lista de aulas não encontrada.');
if (!Array.isArray(pastExamData.exams)) throw new Error('Provas anteriores inválidas: lista não encontrada.');

await mkdir(output, { recursive: true });
await cp(join(root, 'index.html'), join(output, 'index.html'));
await cp(join(root, 'styles.css'), join(output, 'styles.css'));
await cp(join(root, 'favicon.svg'), join(output, 'favicon.svg'));
await cp(join(root, 'src'), join(output, 'src'), { recursive: true });
console.log(`Build estático concluído: ${output}`);
console.log(`Arquivos publicados: ${requiredFiles.join(', ')}`);
