export interface GrammarPoint {
  id: string;
  title: string;
  en: string;
  summary: string;
  rules: string[];
  example: { en: string; zh: string };
  tip: string;
}

export interface GrammarSection {
  id: string;
  order: string;
  title: string;
  en: string;
  intro: string;
  points: GrammarPoint[];
}

// 全站统一的语法框架：2 个态 → 3 大从句 → 4 个重点 → 5 大句型 → 6 大词性
export const GRAMMAR_SECTIONS: GrammarSection[] = [
  {
    id: 'grammar-2',
    order: '02',
    title: '两个态',
    en: 'Tense & Voice',
    intro: '时态看时间与动作关系，语态看主语是动作的发出者还是承受者。',
    points: [
      {
        id: 'tense',
        title: '时态',
        en: 'Tense',
        summary: '先找时间标志，再判断动作是习惯、完成、进行，还是发生在“过去的过去”。',
        rules: [
          '一般现在时：习惯动作、客观真理、按时刻表发生的将来；时间或条件状语从句中用一般现在时表将来。',
          '现在完成时：过去发生、对现在有影响；常与 for、since、so far、recently、in the past few years 连用，不能与 yesterday、last week 等具体过去时间连用。',
          '过去完成时：表示“过去的过去”；by the end of last year、when 从句之前的动作常用它。',
          '现在完成进行时：动作从过去开始、持续到现在并可能继续，强调“一直在做”。',
          '将来完成时：by + 将来时间，表示到那时已经完成，结构为 will have done。',
        ],
        example: {
          en: 'This is the first time he has been out with her alone.',
          zh: '这是他第一次单独和她出去。',
        },
        tip: 'This is the first time that... 后面用现在完成时；since 引导的时间状语从句用一般过去时，主句用现在完成时。',
      },
      {
        id: 'voice',
        title: '语态',
        en: 'Voice',
        summary: '被动语态的核心是“be + 过去分词”，先确认主语是不是动作的承受者。',
        rules: [
          '各时态的被动：is done / was done / has been done / will be done / is being done。',
          '情态动词的被动：can / must / should + be done。',
          '不及物动词和系动词没有被动：happen、occur、take place、break out、belong to、consist of。',
          '主动形式表被动：sell、wash、write、open、read 等与 well、easily、smoothly 连用时。',
          '短语动词变被动时要保留介词或副词：look after → be looked after。',
        ],
        example: {
          en: 'The workers are paid by the hour.',
          zh: '工人们按小时计酬。',
        },
        tip: '感官动词和使役动词的被动要还原 to：be made to do、be seen to do。',
      },
    ],
  },
  {
    id: 'grammar-3',
    order: '03',
    title: '三大从句',
    en: 'Three Clauses',
    intro: '名词性从句看“缺什么成分”，状语从句看“两句什么关系”，定语从句看“先行词在从句里作什么”。',
    points: [
      {
        id: 'noun-clause',
        title: '名词性从句',
        en: 'Noun Clauses',
        summary: '主语、宾语、表语、同位语四个位置；先看从句缺不缺成分，再选连接词。',
        rules: [
          'that 只起连接作用，不作成分、没有词义；what 在从句中作主语、宾语或表语。',
          'whether 可用于介词后、句首和 or not 前；if 一般只用于宾语从句。',
          '从句一律用陈述语序：连接词 + 主语 + 谓语。',
          '主句是过去时，从句用相应的过去时态；客观真理仍用一般现在时。',
          'suggest、order、demand、insist（表“坚持要求”）后的从句用 (should) do。',
        ],
        example: {
          en: 'What he said at the meeting surprised everyone.',
          zh: '他在会上说的话让所有人都很惊讶。',
        },
        tip: '同位语从句解释前面的抽象名词（news、idea、fact、hope），that 不作成分；定语从句的 that 要作成分。',
      },
      {
        id: 'adverbial-clause',
        title: '状语从句',
        en: 'Adverbial Clauses',
        summary: '先判断两句之间的逻辑关系，再选连词；时间和条件从句遵循“主将从现”。',
        rules: [
          '时间：when、while、as、before、after、until、as soon as；while 后常接进行时。',
          '条件：if、unless、as long as、provided that、in case。',
          '原因：because、since、as、now that；for 是并列连词，前面通常有逗号。',
          '让步：although、though、even if、even though、no matter how；不能与 but 连用。',
          '结果：so...that、such...that；目的：so that、in order that。',
        ],
        example: {
          en: 'Provided that the salary meets my expectation, I will accept the job offered.',
          zh: '只要薪水达到我的期望，我就接受这份工作。',
        },
        tip: 'not...until 的强调句和倒装是高频：It was not until he came back that I left. / Not until he came back did I leave.',
      },
      {
        id: 'relative-clause',
        title: '定语从句',
        en: 'Relative Clauses',
        summary: '先找先行词，再看从句缺什么：缺主语或宾语用关系代词，缺状语用关系副词。',
        rules: [
          '关系代词：who / whom（人）、which（物）、that（人或物）、whose（所属）。',
          '关系副词：when 表时间、where 表地点、why 表原因，相当于“介词 + which”。',
          '介词提前后不能用 that 或 who：in which、for whom。',
          '非限制性定语从句不能用 that；先行词是 all、everything、最高级或序数词时常用 that。',
          'as 引导非限制性定语从句，可置于句首，意为“正如”。',
        ],
        example: {
          en: 'This is the village where I spent my childhood.',
          zh: '这就是我度过童年的村庄。',
        },
        tip: '判断用 which 还是 where：把先行词放回从句，缺主语或宾语用 which，缺状语用 where。',
      },
    ],
  },
  {
    id: 'grammar-4',
    order: '04',
    title: '四个重点',
    en: 'Four Keys',
    intro: '非谓语、情态动词、主谓一致、虚拟语气，是单选题里最容易拉开差距的四块。',
    points: [
      {
        id: 'non-finite',
        title: '非谓语',
        en: 'Non-finite Verbs',
        summary: '一个句子里已经有谓语，其他动词就要变成不定式、动名词或分词。',
        rules: [
          '不定式：表目的、将来或具体的一次动作，常作目的状语、宾语和宾补。',
          '动名词：作主语或宾语；介词后一律用 doing。',
          '现在分词表主动、进行；过去分词表被动、完成。',
          '完成式 having done 表示动作发生在谓语之前；被动式 being done / having been done。',
          '独立主格：逻辑主语与主句主语不同时，自带主语 + 分词。',
        ],
        example: {
          en: 'Having finished his homework, he went out to play.',
          zh: '做完作业后，他出去玩了。',
        },
        tip: '分清 to 是介词还是不定式符号：look forward to doing、be used to doing、devote oneself to doing。',
      },
      {
        id: 'modal',
        title: '情态动词',
        en: 'Modal Verbs',
        summary: '情态动词后接动词原形；表推测时，按把握程度从 must 到 cannot 排列。',
        rules: [
          'must 表示肯定推测，cannot / could not 表示否定推测。',
          'must have done：过去一定做过；cannot have done：过去不可能做过。',
          'should / ought to have done：本该做而未做；need not have done：本不必做却做了。',
          'may / might have done：过去可能做过，把握较小。',
          '情态动词的被动：must be done、should have been done。',
        ],
        example: {
          en: 'He must have spent a lot of time studying.',
          zh: '他一定花了很多时间学习。',
        },
        tip: 'must not 表示“禁止”，不表示推测；否定推测用 cannot。',
      },
      {
        id: 'agreement',
        title: '主谓一致',
        en: 'Subject-Verb Agreement',
        summary: '先找真正的主语，再判断单复数；注意语法一致、意义一致和就近原则。',
        rules: [
          'each、every、either、neither 修饰名词时谓语用单数；one of + 复数名词，谓语也用单数。',
          'both...and... 用复数；not only...but also、either...or、neither...nor 遵循就近原则。',
          'family、team、class 等集合名词：看作整体用单数，强调成员用复数。',
          'the number of + 复数名词用单数；a number of + 复数名词用复数。',
          '分数、百分数 + of + 名词，谓语与 of 后的名词一致。',
        ],
        example: {
          en: 'The number of students in our class is forty.',
          zh: '我们班的学生人数是四十。',
        },
        tip: 'there be 句型遵循就近原则：There is a book and two pens on the desk.',
      },
      {
        id: 'subjunctive',
        title: '虚拟语气',
        en: 'Subjunctive Mood',
        summary: '虚拟语气表达与事实相反的假设、愿望、建议或要求。',
        rules: [
          'if 虚拟：与现在相反用 did / were；与过去相反用 had done；与将来相反用 were to do / should do。',
          '省略 if 后倒装：Were I you...、Had I known...、Should it rain...',
          'wish：与现在相反用过去时，与过去相反用过去完成时，将来用 would do。',
          'suggest、order、demand、insist（坚持要求）后的从句用 (should) do。',
          'It is (high) time + 从句用过去时，或 should do。',
        ],
        example: {
          en: 'If I were you, I would accept the offer.',
          zh: '如果我是你，我会接受这个录用机会。',
        },
        tip: 'suggest 表“暗示”、insist 表“坚持说”时，从句用陈述语气。',
      },
    ],
  },
  {
    id: 'grammar-5',
    order: '05',
    title: '五大句型',
    en: 'Five Patterns',
    intro: '倒装、感叹、反义疑问、强调、祈使，专升本单选题里的五类特殊句式。',
    points: [
      {
        id: 'inversion',
        title: '倒装句',
        en: 'Inversion',
        summary: '倒装分完全倒装和部分倒装；否定词、only、so / neither 放句首时先想倒装。',
        rules: [
          '完全倒装：地点状语或表语置于句首，谓语整个提前：Here comes the bus.',
          '部分倒装：never、hardly、little、not only、no sooner 等否定词置于句首，助动词提前。',
          'only + 状语置于句首，主句倒装；only 修饰主语时不倒装。',
          'so / neither / nor 表示“也 / 也不”，结构为 so + 助动词 + 主语。',
          'as / though 引导让步状语从句时，表语、状语或动词原形提前。',
        ],
        example: {
          en: 'Never have I seen such a beautiful sunset.',
          zh: '我从未见过如此美丽的日落。',
        },
        tip: '倒装只提前助动词、情态动词或 be，实义动词仍留在主语后。',
      },
      {
        id: 'exclamation',
        title: '感叹句',
        en: 'Exclamations',
        summary: '先找中心词：中心词是名词用 what，是形容词或副词用 how。',
        rules: [
          'What + a / an + 形容词 + 可数名词单数 + 主谓：What a clever boy he is!',
          'What + 形容词 + 不可数名词或复数名词 + 主谓：What fine weather it is!',
          'How + 形容词或副词 + 主谓：How fast he runs!',
          'How + 形容词 + a / an + 名词 + 主谓：How clever a boy he is!',
        ],
        example: {
          en: 'What a wonderful time we had yesterday!',
          zh: '我们昨天玩得多开心啊！',
        },
        tip: '感叹句常省略主语和谓语，但专升本题目里要能还原完整句子再判断。',
      },
      {
        id: 'tag-question',
        title: '反义疑问句',
        en: 'Tag Questions',
        summary: '前肯后否、前否后肯；助动词和主语都要与陈述部分对应。',
        rules: [
          '陈述部分用肯定，尾句用否定；陈述部分用否定，尾句用肯定。',
          'never、hardly、little、few、no、nothing 视为否定，尾句用肯定。',
          "Let's 用 shall we；Let us 用 will you；祈使句一般用 will you。",
          'I think / believe / suppose 后接宾语从句时，尾句与从句一致。',
          '陈述部分主语是 everyone、somebody、nobody 时，尾句主语用 they。',
        ],
        example: {
          en: 'He hardly knows her, does he?',
          zh: '他几乎不认识她，是吗？',
        },
        tip: '否定词缀不算否定：unhappy 仍按肯定句处理，尾句用否定形式。',
      },
      {
        id: 'emphasis',
        title: '强调句',
        en: 'Emphasis',
        summary: 'It is / was + 被强调部分 + that / who + 其余部分；去掉结构后句子仍完整。',
        rules: [
          '强调人可用 who，强调其他成分一律用 that。',
          '判断方法：去掉 It is / was...that 后，句子仍然完整。',
          'not until 的强调：It was not until...that...',
          '强调谓语用 do / does / did + 动词原形。',
        ],
        example: {
          en: 'It was in the library that I met him.',
          zh: '我是在图书馆遇到他的。',
        },
        tip: '强调时间或地点仍用 that，不能用 when 或 where。',
      },
      {
        id: 'imperative',
        title: '祈使句',
        en: 'Imperatives',
        summary: '以动词原形开头，主语 you 通常省略；否定用 Do not / Never + 原形。',
        rules: [
          '肯定祈使句以动词原形开头：Close the door, please.',
          '否定祈使句用 Do not / Never + 动词原形。',
          "Let's 开头用 shall we；Let me 开头用 will you。",
          '祈使句 + and + 陈述句表示“那么”；祈使句 + or + 陈述句表示“否则”。',
          '强调祈使句用 Do + 动词原形。',
        ],
        example: {
          en: 'Work hard, and you will succeed.',
          zh: '努力学习，你就会成功。',
        },
        tip: "祈使句的反义疑问句一般用 will you，但 Let's 用 shall we。",
      },
    ],
  },
  {
    id: 'grammar-6',
    order: '06',
    title: '六大词性',
    en: 'Six Word Classes',
    intro: '名词、冠词、代词、数词、形容词、副词，先判断词性，再看搭配和形式。',
    points: [
      {
        id: 'noun',
        title: '名词',
        en: 'Nouns',
        summary: '先分可数与不可数，再判断是否需要复数或所有格。',
        rules: [
          '可数名词有单复数，不可数名词没有复数形式。',
          '常见不可数名词：advice、information、news、furniture、equipment、progress。',
          '名词作定语一般用单数：a shoe shop、two apple trees。',
          '所有格：有生命的名词加 -s，无生命的名词常用 of 结构。',
          '抽象名词具体化后可加 a / an：a surprise、a success。',
        ],
        example: {
          en: 'The teacher gave us some useful advice.',
          zh: '老师给了我们一些有用的建议。',
        },
        tip: 'news 虽然以 s 结尾，但是不可数名词，谓语用单数。',
      },
      {
        id: 'article',
        title: '冠词',
        en: 'Articles',
        summary: 'a / an 泛指一个，the 特指；先看发音，再看是否特指。',
        rules: [
          'a / an 表示泛指“一个”，an 用于元音音素开头的词前。',
          'the 表示特指、独一无二、序数词或最高级前。',
          '零冠词：泛指复数或不可数名词、三餐、球类、学科、by + 交通工具。',
          '固定搭配：in the morning、at night、go to school、play the piano。',
          '看发音不看字母：an hour、a university、an honest man。',
        ],
        example: {
          en: 'He is an honest boy.',
          zh: '他是一个诚实的男孩。',
        },
        tip: '再次提到同一人或物用 the；第一次提到用 a / an。',
      },
      {
        id: 'pronoun',
        title: '代词',
        en: 'Pronouns',
        summary: '先判断指代对象，再选主格、宾格、物主代词或反身代词。',
        rules: [
          '人称代词主格作主语，宾格作宾语；物主代词分形容词性和名词性。',
          '反身代词作宾语或同位语：by oneself、enjoy oneself、help oneself。',
          'one 替代同类泛指；that 替代前面提到的可数单数或不可数名词；those 替代复数。',
          'both、either、neither 用于两者；all、any、none 用于三者及以上。',
          'everyone、everybody、something 等不定代词作主语，谓语用单数。',
        ],
        example: {
          en: 'The weather here is much colder than that in my hometown.',
          zh: '这里的天气比我家乡冷得多。',
        },
        tip: 'it 指同一个事物；that 指同类中的另一个，避免重复。',
      },
      {
        id: 'numeral',
        title: '数词',
        en: 'Numerals',
        summary: '基数词、序数词、分数和百分数，重点看复数和谓语一致。',
        rules: [
          'hundred、thousand、million 前有具体数字时不变复数；后接 of 时加 s。',
          '序数词前一般加 the；a second 表示“再一个”。',
          '分数：分子用基数词，分母用序数词；分子大于 1，分母加 s。',
          '百分数、小数作主语，谓语与 of 后的名词一致。',
          'in ones twenties 表示“在某人二十多岁时”，ones 要换成形容词性物主代词：in his twenties。',
        ],
        example: {
          en: 'Two thirds of the students have passed the exam.',
          zh: '三分之二的学生通过了考试。',
        },
        tip: '分数作主语时，谓语看 of 后面的名词：Two thirds of the water is polluted.',
      },
      {
        id: 'adj-adv',
        title: '形容词副词',
        en: 'Adjectives & Adverbs',
        summary: '形容词修饰名词或作表语，副词修饰动词、形容词或另一副词。',
        rules: [
          '形容词修饰名词，或放在系动词后；副词修饰实义动词、形容词或另一副词。',
          '比较级用于两者，最高级用于三者及以上，最高级前常加 the。',
          'as + 原级 + as；not as / so + 原级 + as。',
          '修饰比较级用 much、far、even、still、a lot，不用 very。',
          '倍数表达：倍数 + as + 原级 + as，或倍数 + 比较级 + than。',
        ],
        example: {
          en: 'This book is far more interesting than that one.',
          zh: '这本书比那本有趣得多。',
        },
        tip: 'look、sound、taste、smell、feel 是系动词，后接形容词而不是副词。',
      },
    ],
  },
];
