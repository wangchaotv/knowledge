const OpenAI = require('openai');
const fse = require('fs-extra');
const path = require('path');
const MarkdownIt = require('markdown-it');

const names = require('./names.json');

fse.ensureDirSync(path.join(__dirname, '/output'));

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: 'sk-35a8e29f19554eaba957b316489651b8',
});

const main = async (question) => {
  const filepath = path.join(__dirname, `/output/${question}.md`);
  if (fse.existsSync(filepath)) {
    return true;
  }
  try {
    const completion = await openai.chat.completions.create({
      model: 'deepseek-reasoner',
      messages: [
        {
          role: 'system',
          content:
            '您是一位资深的科普专家，擅长归纳、总结各种知识。我提出问题，您会给出解释，解释分三部分，第一部分做纯粹的科普，第二部分给投资者科普，第三部分给出投资建议。回答尽可能完整，最后给出总结',
        },
        { role: 'user', content: question },
      ],
    });
    const content = completion.choices[0].message.content;
    fse.writeFileSync(filepath, content);
  } catch (error) {
    console.error(error);
  }
};

const generate = async () => {
  const data = {
    names,
    markdown: {},
  };
  for (const name of names) {
    for (const n of name) {
      const filepath = path.join(__dirname, `/output/${n}.md`);
      if (fse.existsSync(filepath)) {
        let str = fse.readFileSync(filepath, { encoding: 'utf-8' });
        const md = new MarkdownIt();
        const result = md.render(str);
        data.markdown[n] = result;
      }
    }
  }

  fse.writeFileSync(
    path.join(__dirname, 'data.js'),
    `const data = ${JSON.stringify(data)}`
  );
};

const start = async () => {
  for (const name of names) {
    for (const n of name) {
      await main(n);
    }
  }
  generate();
};

start();
