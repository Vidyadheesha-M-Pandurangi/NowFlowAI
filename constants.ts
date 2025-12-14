import { Article, ArticleCategory } from './types';

// --- Image Library ---
// A curated list of high-quality Unsplash images for each category to ensure variety.
const CATEGORY_IMAGES: Record<string, string[]> = {
  AI: [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1655720828018-edd2daec9349?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1616161560417-66d4db5892ec?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591453089816-0fbb9e31a9dd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589254065878-42c9d666aa3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555255741-872059955070?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1535378437323-95288ac9dd5c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1495592822108-9e6261896da8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1599202860130-f600f4948364?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531297461136-82lw8z0q?auto=format&fit=crop&w=800&q=80', 
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  ],
  IOT: [
    'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563770095-39d468f9a51d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580894742597-87bc8789db3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555421689-49263452171c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563013544-a64831b3f746?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1585776245991-cf79ddb0fe72?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517420704952-d9f39714c720?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531315630201-bb15abeb1653?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592833072288-724f7e63b367?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1535007811216-59b74b593b4a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581093588401-fbb62a02f138?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581092583537-20d51b4b4f1b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544893708-250c825cb377?auto=format&fit=crop&w=800&q=80'
  ],
  CLOUD: [
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560732488-6b0df240254a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1597852074816-d933c72c6c2e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1523961131990-060661b389ca?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1536411396596-af7aca9773fe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484557052118-f32bd251507d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1483478550801-ceba5fe50e8e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1537432376769-00f5c2f4c8d2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551033406-611cf9a28f67?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd82?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80'
  ],
  CYBERSECURITY: [
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1496096265110-f83ad7f96608?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563206767-5b1d972b9fb9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1510915361405-ef05a8b97165?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618060932014-4deda4932554?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504384308090-c54be3855092?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1525338078858-d1845dab8707?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558234479-749ef9671af9?auto=format&fit=crop&w=800&q=80'
  ],
  VLSI: [
    'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1624969862293-b749659ccc4e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1597733336794-12d05021d510?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556636530-6b7482d80e3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1623933010724-4f51e3c54d72?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618335829737-222891567281?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610484826917-0f101a7bf7f4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1592659762303-90081d34b277?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594729095022-e2f6d2eece9c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1610484826490-3b03f0b24056?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520188741372-e0892c57849e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1549102875-5285311488c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517430816045-df4b7de8dbd8?auto=format&fit=crop&w=800&q=80'
  ],
  QUANTUM: [
    'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1606166187734-a433d1038244?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484557052118-f32bd251507d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509228627129-7252fcc3c1d4?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-15500751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd82?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504384308090-c54be3855092?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531297461136-82lw8z0q?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1618335829737-222891567281?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80'
  ],
  BLOCKCHAIN: [
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1620321023374-d1a68fddadb3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516245834210-c4c14278733f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1609554496796-c345a5335ceb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1639815188546-c43c240ff4df?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1639754390580-2e7174456e7e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1622630998477-20aa696fab05?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1605792657660-596af9009e82?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1621504450168-b87307c131d2?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1641320478175-9c5950007823?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1620321023374-d1a68fddadb3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1639152201720-5e536d25436c?auto=format&fit=crop&w=800&q=80'
  ],
  ROBOTICS: [
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1535378437323-95288ac9dd5c?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1561131668-f63504fb5498?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589254065878-42c9d666aa3d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591453089816-0fbb9e31a9dd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1580835239846-5bb9ce03c8c3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534723328310-e82dad3af43f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555255741-872059955070?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1599582121650-618d451270c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504164996022-090807d7d64a?auto=format&fit=crop&w=800&q=80'
  ],
  BIOTECH: [
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579165466741-7f35a4755657?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581093458791-9f302e6d8659?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1511174511562-5f7f18b874f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518152006812-edab29b069ac?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1535914254981-b5012eebbd15?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516549655169-df83a0a99c6e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1631553128178-5a1e7552554a?auto=format&fit=crop&w=800&q=80'
  ],
  SPACE: [
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1454789548728-85d2696cfb9e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614728853980-6044a28f03c7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1536697246787-1f7ae568d89a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1484557052118-248aad0d8b13?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1537819191377-d3305fdd0ca0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1462332420958-a05d1e002413?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1464802686167-b939a6910659?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516339901601-2e1b87048940?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534723328310-e82dad3af43f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1541185933-71bbbb31d450?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1638209867554-946f1406d2d3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1614314107768-60196238b97d?auto=format&fit=crop&w=800&q=80'
  ],
  CLEANTECH: [
    'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1508514177221-188b1cf2f24f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521618755572-156ae0cdd74d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1546864131-f12e8b60388d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1595166687711-b05423c21c72?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591955506264-3f75b5c18d80?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1501621667575-af81f1f0bacc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1518349619113-03114f06ac3a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524312061326-897c88b4883f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1594910243455-c4a0047353f8?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589254065878-42c9d666aa3d?auto=format&fit=crop&w=800&q=80'
  ],
  TELECOM: [
    'https://images.unsplash.com/photo-1512428559087-560fa5ce7d94?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526662092594-e9a7175238c5?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1544197150-b99a580bbcbf?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562408590-e32931084e23?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1563770095-39d468f9a51d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1520188741372-e0892c57849e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1510511459019-5dda7724fd82?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560732488-6b0df240254a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1534224039826-c7a0eda0e6b3?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1516245834210-c4c14278733f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1504639725590-34d0984388bd?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581093588401-fbb62a02f138?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1597852074816-d933c72c6c2e?auto=format&fit=crop&w=800&q=80'
  ],
};

// --- NEW Helper: Get Unique Images for a Category ---
// Shuffles the category's image pool and returns 'count' unique images.
// If count > pool size, it wraps around but still shuffled.
export const getUniqueCategoryImages = (category: string, count: number): string[] => {
  const keys = Object.keys(CATEGORY_IMAGES);
  // Default to AI if category not found or is "All"
  const key = keys.find(k => category.toUpperCase().includes(k)) || 'AI';
  
  // Clone array to avoid mutating source
  const images = [...CATEGORY_IMAGES[key]];
  
  // Fisher-Yates Shuffle
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }
  
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(images[i % images.length]);
  }
  return result;
};

// --- Raw Article Data Generation ---

const RAW_ARTICLES: Partial<Article>[] = [
  // ... (Existing MOCK_ARTICLES content remains but will be used as fallback) ...
];

// Helper to hydrate the raw articles into full Article objects
const createMockArticles = (): Article[] => {
    // ... (Existing mock creation logic) ...
    // Keeping this function for fallback purposes
    return []; // Return empty by default now, as we want to force live fetch in App.tsx
};

export const MOCK_ARTICLES: Article[] = createMockArticles();

export const SYSTEM_INSTRUCTION = `
You are NowFlowAI, an expert technology news assistant.
Your goal is to answer user questions using both your internal knowledge base (context articles) and Google Search.

RULES:
1.  **Hybrid Information Retrieval:**
    *   **Priority 1 (Context):** If the user asks about a specific article or topic contained in the provided "CONTEXT ARTICLES", strictly use that information. Cite the internal source using the format (Source Name).
    *   **Priority 2 (Google Search):** If the user asks for information NOT in the context, or asks for recent updates/events that occurred after the context articles were published, use the Google Search tool to find the answer.
    *   **Hybrid:** If the user asks a question that connects a context article to broader real-world events, combine both sources.

2.  **Accuracy & Citations:**
    *   Do not invent facts.
    *   When using Google Search, ensure the answer is grounded in the search results.
    *   When using Context, cite the source name provided in the article metadata.

3.  **No Hallucinations:** If you cannot find the answer in either the context or via Google Search, state: "I cannot answer this based on the available information."

4.  **Tone:** Professional, academic, and concise.

5.  **Summarization Protocol:** When asked to summarize an article, strictly adhere to this format for maximum impact:
    *   **The Gist:** A single, high-impact sentence summarizing the core news event.
    *   **Key Details:**
        *   Bullet point with specific numbers/data.
        *   Bullet point with technical specifics.
        *   Bullet point with key stakeholders/companies.
    *   **Why It Matters:** A concise explanation of the future implication or industry shift this represents.
`;