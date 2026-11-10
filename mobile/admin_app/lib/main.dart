import 'package:flutter/material.dart';

void main() => runApp(const AvidezuriAdminApp());

const ink = Color(0xFF29251F);
const gold = Color(0xFFAA8548);
const paper = Color(0xFFFAF7F0);
const muted = Color(0xFF81796D);

class AvidezuriAdminApp extends StatelessWidget {
  const AvidezuriAdminApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Avidezuri Admin',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(useMaterial3: true, scaffoldBackgroundColor: paper, colorScheme: ColorScheme.fromSeed(seedColor: gold)),
    home: const AdminSignInPage(),
  );
}

class AdminSignInPage extends StatelessWidget {
  const AdminSignInPage({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    body: SafeArea(child: Center(child: SingleChildScrollView(
      padding: const EdgeInsets.all(26),
      child: ConstrainedBox(constraints: const BoxConstraints(maxWidth: 420), child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Icon(Icons.diamond_outlined, color: gold, size: 42),
          const SizedBox(height: 18),
          const Text('AVIDEZURI', textAlign: TextAlign.center, style: TextStyle(color: ink, fontSize: 22, letterSpacing: 5)),
          const SizedBox(height: 8),
          const Text('ADMINISTRATION', textAlign: TextAlign.center, style: TextStyle(color: muted, fontSize: 10, letterSpacing: 2)),
          const SizedBox(height: 42),
          const Text('Welcome back', style: TextStyle(color: ink, fontSize: 27)),
          const SizedBox(height: 8),
          const Text('Native sign-in will be enabled after the protected admin service has an approved mobile authentication flow.', style: TextStyle(color: muted, height: 1.5, fontSize: 13)),
          const SizedBox(height: 28),
          const TextField(keyboardType: TextInputType.emailAddress, decoration: InputDecoration(labelText: 'Admin email', border: OutlineInputBorder(), prefixIcon: Icon(Icons.mail_outline))),
          const SizedBox(height: 14),
          const TextField(obscureText: true, decoration: InputDecoration(labelText: 'Password', border: OutlineInputBorder(), prefixIcon: Icon(Icons.lock_outline))),
          const SizedBox(height: 18),
          FilledButton(onPressed: null, style: FilledButton.styleFrom(backgroundColor: gold, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)), child: const Text('SIGN IN')),
          const SizedBox(height: 16),
          const Text('SECURE ACCESS · ROLE-BASED PERMISSIONS', textAlign: TextAlign.center, style: TextStyle(color: muted, fontSize: 9, letterSpacing: 1)),
        ],
      )),
    ))),
  );
}
