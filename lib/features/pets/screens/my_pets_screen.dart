import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_bottom_navigation.dart';
import '../../appointments/screens/my_appointments_screen.dart';
import '../../appointments/screens/book_appointment_flow.dart';
import '../models/pet.dart';
import 'manage_pet_profile_screen.dart';

class MyPetsScreen extends StatelessWidget {
  const MyPetsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        leadingWidth: 60,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: _CircleIconButton(
            icon: Icons.arrow_back,
            onPressed: () => Navigator.pop(context),
          ),
        ),
        centerTitle: true,
        title: const Text(
          'My Pets',
          style: TextStyle(
            color: AppTheme.heading,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _CircleIconButton(icon: Icons.more_horiz, onPressed: () {}),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        children: [
          const Text(
            'Pick a pet to view its profile, appointments, and records.',
            style: TextStyle(
              fontSize: 13,
              height: 1.45,
              color: AppTheme.muted,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 16),
          for (final pet in samplePets) ...[
            _PetListCard(pet: pet),
            const SizedBox(height: 14),
          ],
        ],
      ),
      bottomNavigationBar: AppBottomNavigation(
        selectedIndex: 0,
        items: const [
          AppBottomNavItem(icon: Icons.home_outlined, label: 'Home'),
          AppBottomNavItem(
            icon: Icons.calendar_today_outlined,
            label: 'Appointments',
          ),
          AppBottomNavItem(icon: Icons.description_outlined, label: 'Records'),
          AppBottomNavItem(icon: Icons.menu_book_outlined, label: 'Pet Care'),
        ],
        onSelected: (index) {
          if (index == 0) {
            Navigator.pop(context);
          } else if (index == 1) {
            Navigator.push<void>(
              context,
              MaterialPageRoute<void>(
                builder: (_) => const MyAppointmentsScreen(),
              ),
            );
          }
        },
      ),
    );
  }
}

class _CircleIconButton extends StatelessWidget {
  const _CircleIconButton({required this.icon, required this.onPressed});

  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        border: Border.all(color: const Color(0xFFDDE1E4)),
      ),
      child: IconButton(
        onPressed: onPressed,
        icon: Icon(icon, size: 22, color: AppTheme.heading),
      ),
    );
  }
}

class _PetListCard extends StatelessWidget {
  const _PetListCard({required this.pet});

  final Pet pet;

  void _openProfile(BuildContext context) {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (_) => ManagePetProfileScreen(pet: pet)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasAppointment = pet.nextAppointment != null;

    return InkWell(
      onTap: () => _openProfile(context),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE0E3E5)),
        ),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: const BoxDecoration(
                    color: Color(0xFFF0F6F7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.pets,
                    size: 34,
                    color: Color(0xFF068A98),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pet.name,
                        style: const TextStyle(
                          fontSize: 20,
                          height: 1.1,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.heading,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${pet.breed} - ${pet.gender}',
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.25,
                          color: AppTheme.muted,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        '${pet.age} - ${pet.weight} kg',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.muted,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F6),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.calendar_month_outlined,
                    color: Color(0xFF068A98),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      hasAppointment
                          ? 'Next: ${pet.nextAppointment}'
                          : 'No upcoming appointments',
                      style: TextStyle(
                        fontSize: 13,
                        color: hasAppointment
                            ? const Color(0xFF068A98)
                            : AppTheme.heading,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _openProfile(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.heading,
                      minimumSize: const Size.fromHeight(46),
                      side: const BorderSide(color: Color(0xFFE0E3E5)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'Edit Profile',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      if (hasAppointment) return;
                      Navigator.push<void>(
                        context,
                        MaterialPageRoute<void>(
                          builder: (_) => const BookAppointmentFlow(),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF068A98),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      minimumSize: const Size.fromHeight(46),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      hasAppointment ? 'View Records' : 'Book Visit',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
