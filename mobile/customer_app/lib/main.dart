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
class CartLine {
  CartLine(this.fragrance, this.sizeIndex, [this.quantity = 1]);
  final Fragrance fragrance;
  final int sizeIndex;
  int quantity;
  int get unitPrice => fragrance.prices[sizeIndex];
  int get total => unitPrice * quantity;
}
class DeliveryZone {
  const DeliveryZone(this.area, this.fee);
  final String area;
  final int fee;
}
const deliveryZones = <DeliveryZone>[
  DeliveryZone('Saddar', 200), DeliveryZone('Clifton', 200), DeliveryZone('DHA (Defence)', 200),
  DeliveryZone('PECHS', 200), DeliveryZone('Tariq Road', 200), DeliveryZone('Gulshan-e-Iqbal', 200),
  DeliveryZone('Gulistan-e-Jauhar', 200), DeliveryZone('North Nazimabad', 200), DeliveryZone('Nazimabad', 200),
  DeliveryZone('Federal B Area', 200), DeliveryZone('Garden', 200), DeliveryZone('Bahadurabad', 200),
  DeliveryZone('Korangi', 300), DeliveryZone('Landhi', 300), DeliveryZone('Malir', 300),
  DeliveryZone('Shah Faisal Colony', 300), DeliveryZone('Scheme 33', 300), DeliveryZone('Gulshan-e-Maymar', 300),
  DeliveryZone('North Karachi', 300), DeliveryZone('New Karachi', 300), DeliveryZone('Orangi Town', 300),
  DeliveryZone('SITE', 300), DeliveryZone('Liaquatabad', 300), DeliveryZone('Lyari', 300),
  DeliveryZone('Baldia', 300), DeliveryZone('Keamari', 300),
  DeliveryZone('Bin Qasim', 400), DeliveryZone('Steel Town', 400), DeliveryZone('Gadap', 400),
  DeliveryZone('Surjani Town', 400), DeliveryZone('Hawksbay', 400), DeliveryZone('Manghopir', 400),
  DeliveryZone('Bahria Town Karachi', 400), DeliveryZone('DHA City', 400), DeliveryZone('Gulshan-e-Hadeed', 400),
  DeliveryZone('Other area in Karachi', 400),
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
  final List<CartLine> cart = [];
  String? selectedArea;
  int get deliveryFee => deliveryZones.firstWhere((z) => z.area == selectedArea, orElse: () => const DeliveryZone('', 0)).fee;
  int get cartCount => cart.fold(0, (sum, line) => sum + line.quantity);
  int get cartTotal => cart.fold(0, (sum, line) => sum + line.total);
  void addToCart(Fragrance p, int sizeIndex) {
    final index = cart.indexWhere((line) => line.fragrance.name == p.name && line.sizeIndex == sizeIndex);
    setState(() { if (index >= 0) { cart[index].quantity++; } else { cart.add(CartLine(p, sizeIndex)); } });
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${p.name} added to your bag')));
  }
  void openBag() => showModalBottomSheet<void>(context: context, isScrollControlled: true, backgroundColor: paper, showDragHandle: true,
    builder: (_) => StatefulBuilder(builder: (context, refresh) => Padding(
      padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Your shopping bag', style: TextStyle(fontSize: 23, color: ink)),
        const SizedBox(height: 12),
        if (cart.isEmpty) const Padding(padding: EdgeInsets.all(24), child: Center(child: Text('Your bag is empty. Explore the collection to add a fragrance.')))
        else ...[
          ...cart.map((line) => ListTile(contentPadding: EdgeInsets.zero,
            title: Text(line.fragrance.name, style: const TextStyle(color: ink)),
            subtitle: Text('${sizes[line.sizeIndex]} ml · ${money(line.unitPrice)}'),
            leading: const Icon(Icons.spa_outlined, color: gold),
            trailing: SizedBox(width: 116, child: Row(mainAxisAlignment: MainAxisAlignment.end, children: [
              IconButton(onPressed: () => refresh(() { if (line.quantity > 1) { line.quantity--; } else { cart.remove(line); } }), icon: const Icon(Icons.remove_circle_outline, size: 19)),
              Text('${line.quantity}'),
              IconButton(onPressed: () => refresh(() => line.quantity++), icon: const Icon(Icons.add_circle_outline, size: 19)),
            ])))),
          const Divider(),
          const Text('Delivery area', style: TextStyle(fontWeight: FontWeight.w600, color: ink)),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: selectedArea,
            isExpanded: true,
            decoration: const InputDecoration(hintText: 'Select your Karachi area', filled: true, fillColor: Colors.white, border: OutlineInputBorder()),
            items: deliveryZones.map((zone) => DropdownMenuItem(value: zone.area, child: Text('${zone.area} · ${money(zone.fee)} delivery'))).toList(),
            onChanged: (value) => refresh(() => selectedArea = value),
          ),
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Subtotal'), Text(money(cartTotal))]),
          const SizedBox(height: 6),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text('Delivery'), Text(selectedArea == null ? 'Select area' : money(deliveryFee))]),
          const Divider(),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Estimated total', style: TextStyle(fontWeight: FontWeight.bold)),
            Text(money(cartTotal + (selectedArea == null ? 0 : deliveryFee)), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ]),
          const SizedBox(height: 8),
          const Text('Cash on Delivery checkout will be enabled after the secure mobile ordering connection is ready.', style: TextStyle(color: muted, fontSize: 12)),
        ],
        const SizedBox(height: 10),
      ]),
    )));
  List<Fragrance> get visible => fragrances.where((p) {
    final cat = category == 'All' || (category == 'Exclusive' && p.exclusive) || (category == 'Budget Friendly' && !p.exclusive);
    return cat && p.name.toLowerCase().contains(query.trim().toLowerCase());
  }).toList();
  void details(Fragrance p) {
    var selectedSize = 0;
    showModalBottomSheet<void>(context: context, backgroundColor: paper, showDragHandle: true,
      builder: (_) => StatefulBuilder(builder: (sheetContext, refresh) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: SizedBox(height: 150, child: Image.network(p.imageUrl, fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(Icons.spa_outlined, size: 90, color: gold)))),
          Text(p.name, style: const TextStyle(fontSize: 24, color: ink)),
          Text(p.exclusive ? 'EXCLUSIVE COLLECTION' : 'BUDGET FRIENDLY',
            style: const TextStyle(color: gold, fontSize: 11, letterSpacing: 1.2)),
          const SizedBox(height: 14),
          Wrap(spacing: 8, runSpacing: 6, children: List.generate(3, (i) => ChoiceChip(
            label: Text('${sizes[i]} ml · ${money(p.prices[i])}'),
            selected: selectedSize == i,
            onSelected: (_) => refresh(() => selectedSize = i),
            selectedColor: const Color(0xFFE7D9BE),
            side: BorderSide.none,
          ))),
          const SizedBox(height: 16),
          SizedBox(width: double.infinity, child: FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: ink, foregroundColor: Colors.white, padding: const EdgeInsets.all(14)),
            onPressed: () => addToCart(p, selectedSize),
            icon: const Icon(Icons.shopping_bag_outlined),
            label: const Text('ADD TO BAG'),
          )),
        ]),
      )));
  }
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('AVIDEZURI', style: TextStyle(letterSpacing: 4, fontSize: 18)), centerTitle: true,
      actions: [Padding(padding: const EdgeInsets.only(right: 8), child: IconButton(
        onPressed: openBag, icon: Badge(label: Text('$cartCount'), isLabelVisible: cartCount > 0, child: const Icon(Icons.shopping_bag_outlined))))]),
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
