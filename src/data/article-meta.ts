import type { Article } from '@/lib/types';

export const CATEGORY_META: Record<
  string,
  { description: string; color: string; icon: string; short: string }
> = {
  kepu: {
    description: '从睡眠、听觉到智能与自然法则，训练信息定位与推理判断。',
    color: '#3E6B57',
    icon: 'flask',
    short: '科普',
  },
  jingli: {
    description: '在真实的人生片段里，读懂叙事线索、人物情感与写作意图。',
    color: '#B4813A',
    icon: 'feather',
    short: '记叙',
  },
  yingyong: {
    description: '通知、合同、说明与操作指南，攻克应用文的信息检索题。',
    color: '#5B5B8A',
    icon: 'file',
    short: '应用',
  },
  jingji: {
    description: '商业案例与行业观察，练习观点、数据与逻辑关系的辨析。',
    color: '#8A4B3A',
    icon: 'chart',
    short: '商业',
  },
  lishi: {
    description: '从节日、奥运到礼物文化，在历史与人文语境中练习细节理解。',
    color: '#7A5C3E',
    icon: 'landmark',
    short: '历史',
  },
  shehui: {
    description: '初入职场、出行、饮食与健康，读懂社会生活类说明与议论文。',
    color: '#4F6D7A',
    icon: 'users',
    short: '社会',
  },
};

export const ARTICLE_META: Record<
  string,
  { title: string; subtitle: string; tags: string[]; summary: string }
> = {
  'kepu-01': {
    title: 'Why the Body Needs Sleep',
    subtitle: '睡眠的四个层次',
    tags: ['健康', '睡眠', '说明文'],
    summary: '睡眠如何修复身体？REM 又意味着什么？从四个睡眠层次理解休息的科学。',
  },
  'kepu-02': {
    title: 'Loud Noise, Aspirin and Hearing Loss',
    subtitle: '噪音、阿司匹林与听力损伤',
    tags: ['健康', '实验', '因果'],
    summary: '一项以男大学生为对象的实验，揭示阿司匹林如何放大噪音造成的暂时性听力损伤。',
  },
  'kepu-03': {
    title: 'Is Intelligence Born or Made?',
    subtitle: '智力是天生的，还是环境塑造的？',
    tags: ['心理学', '双胞胎', '论点'],
    summary: '先天与后天各占多少？作者用血缘关系与双胞胎案例给出自己的答案。',
  },
  'kepu-04': {
    title: "Rethinking TV's Influence on Children",
    subtitle: '重新理解电视对儿童的影响',
    tags: ['教育', '媒体', '反驳'],
    summary: '心理学家 Anderson 挑战“电视有害”的常识，把家庭与父母的作用放回讨论中心。',
  },
  'kepu-05': {
    title: 'The Science of Sleepwalking',
    subtitle: '梦游为什么会发生？',
    tags: ['健康', '睡眠', '数据'],
    summary: '梦游不是“完全睡着”，也不是“完全清醒”。年龄、深睡时长与遗传共同影响它。',
  },
  'kepu-06': {
    title: 'Eating Habits and Good Health',
    subtitle: '饮食习惯与身体健康',
    tags: ['健康', '饮食', '例证'],
    summary: '从甜食、食欲到英国法官的“干面包断案”，说明规律饮食与情绪如何影响身体。',
  },
  'kepu-07': {
    title: 'Rock, Paper, Scissors: The Ultimate Game',
    subtitle: '石头剪刀布的终极策略',
    tags: ['游戏', '策略', '人物'],
    summary: '一个从小用石头剪刀布解决分歧的男孩，如何把这门“童年游戏”玩成世界级比赛。',
  },
  'kepu-08': {
    title: 'Why Every Face Is Unique',
    subtitle: '为什么人脸各不相同',
    tags: ['科学', '面孔', '识别'],
    summary: '面孔像指纹一样独特。我们究竟如何识别一张脸？答案比想象中复杂。',
  },
  'kepu-09': {
    title: 'The Mathematics of Nature',
    subtitle: '自然界的数学精确性',
    tags: ['自然', '数学', '规律'],
    summary: '蜜蜂振翅、天体运行、花瓣排列——自然界的精确法则如何被人类发现与运用。',
  },
  'kepu-10': {
    title: 'The Hidden Rules of the Dinner Table',
    subtitle: '餐桌上的隐藏规则',
    tags: ['家庭', '社会学', '研究'],
    summary: '社会学家观察 50 个家庭的晚餐，发现餐桌远不只是吃饭的地方。',
  },
  'jingli-01': {
    title: 'The Young Man Who Could Not Read',
    subtitle: '那个不识字却藏了很久的年轻人',
    tags: ['成长', '尊严', '叙事'],
    summary: '一个外表自信的十九岁青年，如何用各种“技巧”掩盖自己无法读写的事实。',
  },
  'jingli-02': {
    title: 'What College Taught Me About Being on My Own',
    subtitle: '大学教会我的独立',
    tags: ['校园', '独立', '第一人称'],
    summary: '离开家之后，开银行账户、安排时间、认识不同的人——独立是从一件件小事开始的。',
  },
  'jingli-03': {
    title: 'Three Roommates, Three Languages',
    subtitle: '三个室友，三种语言',
    tags: ['语言', '跨文化', '友谊'],
    summary: '在华盛顿学英语的那一年，作者和两个美国室友互相“交换母语”，也交换了看世界的方式。',
  },
  'jingli-04': {
    title: 'Four Years on the Island',
    subtitle: '荒岛上的第四年',
    tags: ['名著', '冒险', '鲁滨逊'],
    summary: '种粮、防鸟、烧陶、造船——鲁滨逊在荒岛上的四年，是与自然反复较量的四年。',
  },
  'jingli-05': {
    title: "Growing Up as an Astronaut's Son",
    subtitle: '作为宇航员的儿子长大',
    tags: ['家庭', '自我认同', '成长'],
    summary: '当一个普通男孩拥有一个“完美”的宇航员父亲，他如何找到属于自己的位置？',
  },
  'jingli-06': {
    title: 'My First Day at Toyota',
    subtitle: '我在丰田的第一天',
    tags: ['职场', '细节', '成长'],
    summary: '一份看似“小菜一碟”的数据核对工作，让职场新人第一次理解什么叫认真。',
  },
  'jingli-07': {
    title: 'The Words That Changed My Life',
    subtitle: '改变我一生的那句话',
    tags: ['母爱', '信念', '励志'],
    summary: '母亲每晚重复的一句话，支撑一个男孩走过贫困与车祸，最终成就一生。',
  },
  'jingli-08': {
    title: 'How I Made Reading Safe Again',
    subtitle: '我如何让学生不再害怕阅读',
    tags: ['教育', '阅读', '教师'],
    summary: '当众朗读让阅读变成羞辱。一位五年级老师决定改变这一切。',
  },
  'jingli-09': {
    title: "The Smoke in Mrs. Clarke's House",
    subtitle: '克拉克太太家里的烟味',
    tags: ['悬疑', '推理', '独居'],
    summary: '门窗完好，屋里却有烟味。独居老人如何发现有人偷偷进过自己的家？',
  },
  'jingli-10': {
    title: 'The 1973 Word Game',
    subtitle: '一盒 1973 年的拼字游戏',
    tags: ['收藏', '拍卖', '反转'],
    summary: 'Peter 花很少的钱买到一盒未拆封的旧游戏，拍卖行给出的估价让他大吃一惊。',
  },
  'jingli-11': {
    title: 'A Better Store, a Better Life',
    subtitle: '搬店之后，生活也变好了',
    tags: ['小店', '经营', '生活'],
    summary: '一位服装店主搬进新街区，生意变好了，但老建筑也带来了新的麻烦。',
  },
  'yingyong-01': {
    title: 'Visiting the White House',
    subtitle: '白宫参观须知',
    tags: ['通知', '规则', '信息检索'],
    summary: '预约白宫参观需要提前多久？团队人数、安检与取消规则分别是什么？',
  },
  'yingyong-02': {
    title: 'Terms and Conditions of Employment',
    subtitle: '雇佣合同条款',
    tags: ['合同', '职场', '细节'],
    summary: '工资、工时、年假、加班与工服——一份合同里藏着劳动者最该看清的细节。',
  },
  'jingji-01': {
    title: 'The Band That Gave Away Its Album',
    subtitle: '把专辑免费送人的乐队',
    tags: ['商业', '音乐', '数字化'],
    summary: '一支独立乐队主动免费发布专辑，却靠演出和周边赚得更多。数字时代的音乐生意正在改写。',
  },
  'lishi-01': {
    title: 'The Spring Festival',
    subtitle: '春节：团圆与祝福',
    tags: ['节日', '文化', '说明文'],
    summary: '从置办年货、包饺子到除夕团圆饭，一篇短文讲清中国最重要的传统节日。',
  },
  'lishi-02': {
    title: 'Stamps of the White Olympics',
    subtitle: '白色奥运会的邮票',
    tags: ['奥运', '邮票', '历史'],
    summary: '从 1932 年美国首发纪念邮票，到各国竞相发行，小小邮票记录了冬奥会的历史。',
  },
  'shehui-01': {
    title: 'Learning to Behave in the Working World',
    subtitle: '职场第一课：向榜样学习',
    tags: ['职场', '成长', '建议'],
    summary: '刚毕业的年轻人如何适应职场？作者给出的答案是：找到一个值得敬佩的同事，观察他如何做事。',
  },
  'shehui-02': {
    title: 'A Guide to Your Luggage',
    subtitle: '行李处理指南',
    tags: ['出行', '行李', '说明文'],
    summary: '行李丢了怎么办？超重谁来付费？标签怎么写？一篇实用的航空行李说明。',
  },
  'shehui-03': {
    title: 'City Life or Country Life?',
    subtitle: '城市与乡村之间',
    tags: ['城乡', '对比', '议论'],
    summary: '城市有便利也有孤立，乡村有宁静也有不便。作者用幽默的笔触拆解“归园田居”的幻想。',
  },
  'shehui-04': {
    title: 'Learning Never Ends',
    subtitle: '继续教育：学习没有终点',
    tags: ['教育', '成人', '终身学习'],
    summary: '美国的继续教育为成年人提供了重新学习的机会：为工作、为兴趣，也为更好的自己。',
  },
  'shehui-05': {
    title: 'Disability and the Barriers Around Us',
    subtitle: '残疾人与无形的障碍',
    tags: ['残障', '社会', '态度'],
    summary: '真正难以打破的，往往不是台阶和车门，而是偏见与无知。',
  },
  'shehui-06': {
    title: 'How Successful Learners Learn',
    subtitle: '成功语言学习者的三个习惯',
    tags: ['语言', '学习', '方法'],
    summary: '独立、主动、有目的——成功语言学习者身上反复出现的三个共同点。',
  },
  'shehui-07': {
    title: 'Why Repetition Bores Us',
    subtitle: '重复与单调',
    tags: ['工作', '心理', '故事'],
    summary: '一顶帽子五美元，订两百顶却要十美元一顶。帽子店老板的解释，道出了美国人对重复劳动的态度。',
  },
  'shehui-08': {
    title: 'Writing a Job Application Letter',
    subtitle: '如何写求职信',
    tags: ['求职', '写作', '建议'],
    summary: '求职信不是简历的重复：说够、说准、说清你为什么最适合这份工作。',
  },
  'shehui-09': {
    title: 'Health Care in the U.S. and Britain',
    subtitle: '美英医疗体系对比',
    tags: ['医疗', '对比', '社会'],
    summary: '从家庭医生、专科预约到急救与保险，对比美英两国医疗服务的不同逻辑。',
  },
  'shehui-10': {
    title: 'Men and Women Go Shopping',
    subtitle: '男女购物的不同',
    tags: ['消费', '性别', '对比'],
    summary: '男人带着明确目标进店，女人常常只是“随便看看”。一篇轻松的消费行为对比。',
  },
  'shehui-11': {
    title: 'Pop Music and the Drug Message',
    subtitle: '流行音乐与毒品信息',
    tags: ['媒体', '毒品', '社会'],
    summary: '联合国报告批评西方流行音乐产业传播“对毒品友好”的文化，并点名媒体的推波助澜。',
  },
  'shehui-12': {
    title: 'What Is in Our Food?',
    subtitle: '食物里的科学与风险',
    tags: ['食品', '健康', '科学'],
    summary: '科学让食物更安全，也让一些潜在有害物质进入餐桌。硝酸盐、抗生素与添加剂背后的健康风险。',
  },
};

export function applyMeta(articles: Article[]): Article[] {
  return articles.map((a) => {
    const m = ARTICLE_META[a.id];
    return {
      ...a,
      title: m?.title || a.heading || a.fallbackTitle,
      subtitle: m?.subtitle || '',
      tags: m?.tags || [],
      summary: m?.summary || '',
      source: a.source || 'bundled',
    };
  });
}
