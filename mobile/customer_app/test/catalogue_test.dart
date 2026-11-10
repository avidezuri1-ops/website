import 'package:flutter_test/flutter_test.dart';
import 'package:avidezuri_customer/main.dart';
void main() {
  test('catalogue contains all 22 storefront fragrances', () => expect(fragrances, hasLength(22)));
  test('price tiers match storefront configuration', () {
    expect(fragrances.first.prices, [1450, 1750, 2250]);
    expect(fragrances[1].prices, [1750, 2550, 4500]);
  });
  test('exclusive collection contains twelve fragrances', () => expect(fragrances.where((p) => p.exclusive), hasLength(12)));
  test('product image slug handles apostrophes', () => expect(Fragrance('DE ALEE’SHA', true).slug, 'de-alee-sha'));
  test('cart line calculates selected size and quantity total', () {
    final line = CartLine(fragrances.first, 2, 2);
    expect(line.unitPrice, 2250);
    expect(line.total, 4500);
  });
}