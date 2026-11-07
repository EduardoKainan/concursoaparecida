# Próxima — preparação para concursos

MVP inicial para o concurso da Secretaria de Educação de Aparecida de Goiânia, começando pela trilha de **Auxiliar de Secretaria**.

## Estado atual

- Aplicação web estática e responsiva; sem instalação de dependências de framework.
- Conteúdo programático do cargo piloto estruturado com referências ao Anexo IV do Edital nº 01/2026.
- Painel, navegação por conteúdo, busca externa de vídeos no YouTube e uma questão demonstrativa autoral.
- Progresso de tópicos gravado no `localStorage` do navegador.
- Os demais cargos aparecem como “em preparação”; não são apresentados como trilhas disponíveis.
- Ainda não há conta de usuário, sincronização na nuvem, conteúdo didático curado completo, catálogo de questões de provas anteriores, nem pagamento. A questão incluída é demonstrativa, não é questão de banca e requer revisão antes de uso comercial.

## Desenvolvimento local

Requer Node.js 20+ e npm. O app não tem dependências de runtime; ESLint é dependência apenas de desenvolvimento.

```bash
npm install
npm test
npm run lint
npm run check
npm run build
python3 -m http.server 8000 --directory dist
```

Depois abra `http://localhost:8000`.

## Publicar na Vercel

1. Importe `EduardoKainan/concursoaparecida` na Vercel.
2. Framework Preset: **Other**.
3. Root Directory: `/` (raiz do repositório).
4. Build Command: `npm run build`.
5. Output Directory: `dist`.
6. Install Command pode ficar no padrão; o projeto não tem dependências externas de npm.

Nenhuma variável de ambiente é necessária para esta versão. O app é estático e pode ser publicado sem Supabase. Não colocar segredos no frontend. Para produto comercial com login e progresso entre dispositivos, adicionar backend (por exemplo, Supabase) e políticas de acesso antes de ligar contas e pagamentos.

## Fonte do concurso

- [Página oficial do Instituto Verbena/UFG](https://sistemas.institutoverbena.ufg.br/2026/concurso-prefeitura-aparecida-de-goiania-educacao/)
- [Edital de Abertura nº 01/2026 em PDF](https://sistemas.institutoverbena.ufg.br/2026/concurso-prefeitura-aparecida-de-goiania-educacao/sistema/arquivos/anexos/Edital_Concurso_P%C3%BAblico_da_Secretaria_de_Educa%C3%A7%C3%A3o_da_Prefeitura_Municipal_de_Aparecida_de_Goi%C3%A2nia-GO.pdf)

Os dados refletem o edital consultado; conferir retificações oficiais antes de usar em publicidade ou orientar candidatos.
