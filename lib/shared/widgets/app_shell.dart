import 'package:flutter/material.dart';

import '../../features/appointments/screens/my_appointments_screen.dart';
import '../../features/home/screens/home_page.dart';
import '../../features/pet_care/screens/pet_care_screen.dart';
import '../../features/records/screens/medical_records_screen.dart';
import 'app_bottom_navigation.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  void _selectTab(int index) {
    if (_selectedIndex != index) {
      setState(() => _selectedIndex = index);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          HomePage(onNavigate: _selectTab),
          const MyAppointmentsScreen(showBottomNavigation: false),
          const MedicalRecordsScreen(),
          const PetCareScreen(),
        ],
      ),
      bottomNavigationBar: AppBottomNavigation(
        selectedIndex: _selectedIndex,
        items: const [
          AppBottomNavItem(icon: Icons.home_outlined, label: 'Home'),
          AppBottomNavItem(
            icon: Icons.calendar_today_outlined,
            label: 'Appointments',
          ),
          AppBottomNavItem(icon: Icons.description_outlined, label: 'Records'),
          AppBottomNavItem(icon: Icons.menu_book_outlined, label: 'Pet Care'),
        ],
        onSelected: _selectTab,
      ),
    );
  }
}
