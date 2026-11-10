import 'package:flutter/material.dart';
void main() => runApp(const AvidezuriCustomerApp());
const ink = Color(0xFF29251F), gold = Color(0xFFAA8548), paper = Color(0xFFFAF7F0), muted = Color(0xFF81796D);
const sizes = [30, 50, 100], budgetPrices = [1450, 1750, 2250], exclusivePrices = [1750, 2550, 4500];
class Fragrance {
  const Fragrance(this.name, this.exclusive);
  final String name; final bool exclusive;
  List<int> get prices => exclusive ? exclusivePrices : budgetPrices;
  String get slug => name.toLowerCase().replaceAll('’', '').replaceAll("'", '').replaceAll(RegExp(r'[^a-z0-9]+'), '-').replaceAll(RegExp(r'^-|-$'), '');
  String get imageUrl => 'https://avidezuri.com/images/$slug.png';
}
const fragrances = <Fragrance>[
  Fragrance('DE WANTED', false), Fragrance('DE NIGHT', true), Fragrance('DE FLORA', false), Fragrance('DE SWIM', true),
  Fragrance('DE CREVENTUS', false), Fragrance('DE MOVEMENT', false), Fragrance('DE ANGEL', true), Fragrance('DE ALEE’SHA', true),
  Fragrance('DE BOMB', false), Fragrance('DE OCEAN', false), Fragrance('IN DE SEA', false), Fragrance('DE SAV WILD', false),
  Fragrance('DE TRUE BOND', false), Fragrance('DE AQUA', true), Fragrance('DE CRISTAL ROUGE', true), Fragrance('DE DESIRE', true),
  Fragrance('DE WOMEN', true), Fragrance('DE LEATHER', false), Fragrance('DE FANTASY', true), Fragrance('DE MOUNTAIN', true),
  Fragrance('DE BLACK', true), Fragrance('DE NOIR', true),
];
String money(int n) => 'Rs ' + n.toString().replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');
class AvidezuriCustomerApp extends StatelessWidget {
  const AvidezuriCustomerApp({super.key});
  @override Widget build(BuildContext context) => MaterialApp(title: 'Avidezuri', debugShowCheckedModeBanner: false,
    theme: ThemeData(useMaterial3: true, scaffoldBackgroundColor: paper, colorScheme: ColorScheme.fromSeed(seedColor: gold)),
    home: const CustomerHomePage());
}
class CustomerHomePage extends StatefulWidget {
  const CustomerHomePage({super.key});
  @override State<CustomerHomePage> createState() => _CustomerHomePageState();
}
class _CustomerHomePageState extends State<CustomerHomePage> {
  String category = 'All', query = '';
  List<Fragrance> get visible => fragrances.where((p) {
    final cat = category == 'All' || (category == 'Exclusive' && p.exclusive) || (category == 'Budget Friendly' && !p.exclusive);
    return cat && p.name.toLowerCase().contains(query.trim().toLowerCase());
  }).toList();
  void details(Fragrance p) => showModalBottomSheet<void>(context: context, backgroundColor: paper, showDragHandle: true,
    builder: (_) => Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      Center(child: SizedBox(height: 160, child: Image.network(p.imageUrl, fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => const Icon(Icons.spa_outlined, size: 96, color: gold)))),
      Text(p.name, style: const TextStyle(fontSize: 24, color: ink)),
      Text(p.exclusive ? 'EXCLUSIVE COLLECTION' : 'BUDGET FRIENDLY', style: const TextStyle(color: gold, fontSize: 11, letterSpacing: 1.2)),
      const SizedBox(height: 12),
      ...List.generate(3, (i) => Padding(padding: const EdgeInsets.symmetric(vertical: 7), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(sizes[i].toString() + ' ml'), Text(money(p.prices[i]), style: const TextStyle(fontWeight: FontWeight.w600)),
      ]))),
      const Text('Shopping bag and checkout are coming in the next app stage.', style: TextStyle(color: muted, fontSize: 12)),
    ])));
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('AVIDEZURI', style: TextStyle(letterSpacing: 4, fontSize: 18)), centerTitle: true,
      actions: [IconButton(onPressed: () {}, icon: const Icon(Icons.shopping_bag_outlined))]),
    body: CustomScrollView(slivers: [
      SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Container(padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: const Color(0xFFECE3D3), borderRadius: BorderRadius.circular(22)),
        child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('THE ART OF\nFRAGRANCE', style: TextStyle(color: ink, fontSize: 29, height: 1.15)),
          SizedBox(height: 10), Text('Discover a scent that feels like you.', style: TextStyle(color: muted)),
          SizedBox(height: 16), Text('30 ML  ·  50 ML  ·  100 ML', style: TextStyle(color: gold, fontSize: 11, letterSpacing: 1.2)),
        ])))),
      SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: TextField(
        onChanged: (v) => setState(() => query = v), decoration: InputDecoration(hintText: 'Search fragrances', prefixIcon: const Icon(Icons.search),
          filled: true, fillColor: Colors.white, border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none))))),
      SliverToBoxAdapter(child: SizedBox(height: 54, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.all(8),
        children: ['All', 'Budget Friendly', 'Exclusive'].map((v) => Padding(padding: const EdgeInsets.symmetric(horizontal: 4),
          child: ChoiceChip(label: Text(v), selected: category == v, onSelected: (_) => setState(() => category = v),
            selectedColor: const Color(0xFFE7D9BE), side: BorderSide.none))).toList()))),
      SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.fromLTRB(20, 10, 20, 12), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('The collection', style: TextStyle(fontSize: 23, color: ink)), Text(visible.length.toString() + ' fragrances', style: const TextStyle(color: muted, fontSize: 12)),
      ]))),
      if (visible.isEmpty) const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(30), child: Text('No fragrances match your search.'))))
      else SliverPadding(padding: const EdgeInsets.symmetric(horizontal: 16), sliver: SliverGrid(
        delegate: SliverChildBuilderDelegate((_, i) => FragranceCard(fragrance: visible[i], onTap: () => details(visible[i])), childCount: visible.length),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: .70))),
      const SliverToBoxAdapter(child: SizedBox(height: 24)),
    ]),
    bottomNavigationBar: NavigationBar(selectedIndex: 0, backgroundColor: paper, destinations: const [
      NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'), NavigationDestination(icon: Icon(Icons.grid_view_outlined), label: 'Shop'),
      NavigationDestination(icon: Icon(Icons.local_shipping_outlined), label: 'Track'), NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
    ]));
}
class FragranceCard extends StatelessWidget {
  const FragranceCard({super.key, required this.fragrance, required this.onTap});
  final Fragrance fragrance; final VoidCallback onTap;
  @override Widget build(BuildContext context) => Material(color: Colors.white, borderRadius: BorderRadius.circular(18), clipBehavior: Clip.antiAlias,
    child: InkWell(onTap: onTap, child: Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(child: Center(child: Image.network(fragrance.imageUrl, fit: BoxFit.contain, errorBuilder: (_, __, ___) => Container(width: double.infinity,
        decoration: BoxDecoration(color: const Color(0xFFECE3D3), borderRadius: BorderRadius.circular(14)), child: const Icon(Icons.spa_outlined, size: 54, color: gold))))),
      const SizedBox(height: 8), Text(fragrance.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: ink, fontSize: 13, fontWeight: FontWeight.w600)),
      Text(fragrance.exclusive ? 'EXCLUSIVE' : 'BUDGET FRIENDLY', style: const TextStyle(color: gold, fontSize: 9)),
      const SizedBox(height: 4), Text('From ' + money(fragrance.prices[0]), style: const TextStyle(color: ink, fontSize: 12)),
      const SizedBox(height: 6), const Text('VIEW FRAGRANCE  →', style: TextStyle(color: gold, fontSize: 9, fontWeight: FontWeight.bold)),
    ]))));
}
