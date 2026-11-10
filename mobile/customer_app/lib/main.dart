import 'package:flutter/material.dart';

void main() => runApp(const AvidezuriCustomerApp());

const ink = Color(0xFF29251F);
const gold = Color(0xFFAA8548);
const paper = Color(0xFFFAF7F0);
const muted = Color(0xFF81796D);

class AvidezuriCustomerApp extends StatelessWidget {
  const AvidezuriCustomerApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Avidezuri',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(useMaterial3: true, scaffoldBackgroundColor: paper,
      colorScheme: ColorScheme.fromSeed(seedColor: gold),
      appBarTheme: const AppBarTheme(backgroundColor: paper, foregroundColor: ink, elevation: 0)),
    home: const CustomerHomePage(),
  );
}

class CustomerHomePage extends StatelessWidget {
  const CustomerHomePage({super.key});
  static const products = <String>[
    'DE WANTED','DE NIGHT','DE FLORA','DE SWIM','DE CREVENTUS','DE MOVEMENT',
    'DE ANGEL','DE ALEE’SHA','DE BOMB','DE OCEAN','IN DE SEA','DE SAV WILD',
    'DE TRUE BOND','DE AQUA','DE CRISTAL ROUGE','DE DESIRE','DE WOMEN',
    'DE LEATHER','DE FANTASY','DE MOUNTAIN','DE BLACK','DE NOIR',
  ];
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('AVIDEZURI', style: TextStyle(letterSpacing: 4, fontSize: 18, fontWeight: FontWeight.w600)),
      centerTitle: true,
      actions: [IconButton(onPressed: () {}, icon: const Icon(Icons.shopping_bag_outlined), tooltip: 'Shopping bag')],
    ),
    body: CustomScrollView(slivers: [
      SliverToBoxAdapter(child: Padding(
        padding: const EdgeInsets.fromLTRB(22,22,22,26),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: const Color(0xFFECE3D3), borderRadius: BorderRadius.circular(22)),
          child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('THE ART OF\nFRAGRANCE', style: TextStyle(color: ink, fontSize: 29, height: 1.15, letterSpacing: 1.2)),
            SizedBox(height: 12),
            Text('Discover a scent that feels like you.', style: TextStyle(color: muted, fontSize: 14)),
            SizedBox(height: 18),
            Text('EXPLORE THE COLLECTION  →', style: TextStyle(color: gold, fontSize: 11, letterSpacing: 1.3, fontWeight: FontWeight.bold)),
          ]),
        ),
      )),
      SliverToBoxAdapter(child: Padding(
        padding: const EdgeInsets.fromLTRB(22,0,22,14),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          const Text('The collection', style: TextStyle(fontSize: 23, color: ink)),
          Text('${products.length} fragrances', style: const TextStyle(fontSize: 12, color: muted)),
        ]),
      )),
      SliverPadding(padding: const EdgeInsets.symmetric(horizontal: 18), sliver: SliverGrid(
        delegate: SliverChildBuilderDelegate((context,index) => ProductTile(name: products[index], index: index), childCount: products.length),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 12, crossAxisSpacing: 12, childAspectRatio: .78),
      )),
      const SliverToBoxAdapter(child: SizedBox(height: 28)),
    ]),
    bottomNavigationBar: NavigationBar(selectedIndex: 0, backgroundColor: paper, destinations: const [
      NavigationDestination(icon: Icon(Icons.home_outlined), label: 'Home'),
      NavigationDestination(icon: Icon(Icons.grid_view_outlined), label: 'Shop'),
      NavigationDestination(icon: Icon(Icons.local_shipping_outlined), label: 'Track'),
      NavigationDestination(icon: Icon(Icons.person_outline), label: 'Account'),
    ]),
  );
}

class ProductTile extends StatelessWidget {
  const ProductTile({super.key, required this.name, required this.index});
  final String name;
  final int index;
  @override
  Widget build(BuildContext context) {
    const shades = [Color(0xFFE8DDCA), Color(0xFFE6DCD7), Color(0xFFDEDCCF)];
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
      padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(child: Center(child: Container(width: 82,
          decoration: BoxDecoration(color: shades[index % shades.length], borderRadius: BorderRadius.circular(24)),
          child: const Icon(Icons.local_florist_outlined, size: 38, color: gold)))),
        const SizedBox(height: 10),
        Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: ink, fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 5),
        const Text('30 ml · from Rs 1,450', style: TextStyle(color: muted, fontSize: 10)),
        const SizedBox(height: 8),
        const Row(children: [
          Text('VIEW FRAGRANCE', style: TextStyle(color: gold, fontSize: 9, letterSpacing: .8, fontWeight: FontWeight.bold)),
          Spacer(), Icon(Icons.arrow_forward, size: 14, color: gold),
        ]),
      ]),
    );
  }
}
