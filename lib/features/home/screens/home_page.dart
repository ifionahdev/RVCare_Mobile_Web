import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../../../shared/widgets/app_bottom_navigation.dart';
import '../../appointments/screens/book_appointment_flow.dart';
import '../../appointments/screens/my_appointments_screen.dart';
import '../../pets/screens/manage_pet_profile_screen.dart';
import '../../pets/screens/my_pets_screen.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedTab = 0;

  static const Color _teal = Color(0xFF068A98);
  void _openBooking() {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (_) => const BookAppointmentFlow()),
    );
  }

  void _openAppointments() {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => const MyAppointmentsScreen(),
      ),
    );
  }

  void _openMyPets() {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (_) => const MyPetsScreen()),
    );
  }

  void _openDetails(String title) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.border,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 22),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.heading,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'This prototype section is ready for content. Mock data is used for now.',
              style: TextStyle(
                fontSize: 13,
                height: 1.5,
                color: AppTheme.muted,
              ),
            ),
            const SizedBox(height: 22),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(sheetContext),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _teal,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: _selectedTab == 0 ? _buildHome() : _buildPlaceholder(),
      bottomNavigationBar: AppBottomNavigation(
        selectedIndex: _selectedTab,
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
          if (index == 1) {
            _openAppointments();
            return;
          }
          setState(() => _selectedTab = index);
        },
      ),
    );
  }

  Widget _buildHome() {
    return SafeArea(
      top: true,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Good evening',
              style: TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Hello, Sarah',
                    style: TextStyle(
                      fontSize: 22,
                      height: 1.15,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                ),
                Container(
                  width: 48,
                  height: 48,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE7EAEC),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFD9DDE0)),
                  ),
                  child: const Text(
                    'SJ',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: _teal,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _AppointmentCard(
              onDetails: () => _openDetails('Upcoming appointment'),
            ),
            const SizedBox(height: 12),
            _ReminderCard(),
            const SizedBox(height: 16),
            const Text(
              'What would you like to do?',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppTheme.heading,
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.calendar_month_outlined,
                    title: 'Book Appointment',
                    onTap: _openBooking,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.description_outlined,
                    title: 'Medical Records',
                    onTap: () => setState(() => _selectedTab = 2),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: _ActionCard(
                    icon: Icons.science_outlined,
                    title: 'Laboratory Reports',
                    badge: '2 new',
                    onTap: () => _openDetails('Laboratory Reports'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _ActionCard(
                    icon: Icons.menu_book_outlined,
                    title: 'Pet Care Info',
                    onTap: () => setState(() => _selectedTab = 3),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'My pets',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.heading,
                  ),
                ),
                TextButton(
                  onPressed: _openMyPets,
                  style: TextButton.styleFrom(
                    foregroundColor: _teal,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text(
                    'See all',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            _PetCard(
              onTap: () {
                Navigator.push<void>(
                  context,
                  MaterialPageRoute<void>(
                    builder: (_) => const ManagePetProfileScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    final labels = ['', 'My Appointments', 'Medical Records', 'Pet Care'];
    final descriptions = [
      '',
      'Manage your upcoming and previous appointments.',
      'View Luna’s visit history, prescriptions, and reports.',
      'Helpful articles and daily care reminders for Luna.',
    ];

    return SafeArea(
      top: true,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        children: [
          Text(
            labels[_selectedTab],
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            descriptions[_selectedTab],
            style: const TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
          const SizedBox(height: 18),
          if (_selectedTab == 1)
            ElevatedButton.icon(
              onPressed: _openBooking,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Book new appointment'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _teal,
                foregroundColor: Colors.white,
                elevation: 0,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          if (_selectedTab == 1) const SizedBox(height: 16),
          ..._buildTabCards(),
        ],
      ),
    );
  }

  List<Widget> _buildTabCards() {
    final cards = switch (_selectedTab) {
      1 => const [
          ('Wed, Nov 4 • 10:00 AM', 'Checkup for Luna', 'Confirmed'),
          ('Tue, Dec 8 • 9:30 AM', 'Vaccination for Luna', 'Upcoming'),
        ],
      2 => const [
          ('Checkup report', 'Nov 4, 2026 • Dr. Rachel Carter', 'Available'),
          ('Blood test results', 'Oct 12, 2026 • Laboratory', '2 new'),
        ],
      3 => const [
          ('Dental care', 'How often should you brush your pet’s teeth?', ''),
          ('Nutrition guide', 'A balanced diet for your pet’s life stage.', ''),
        ],
      _ => const <(String, String, String)>[],
    };

    return [
      for (var index = 0; index < cards.length; index++) ...[
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE1E4E7)),
          ),
          child: Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFDBF5F8),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  _selectedTab == 1
                      ? Icons.calendar_month_outlined
                      : _selectedTab == 2
                      ? Icons.description_outlined
                      : Icons.menu_book_outlined,
                  color: _teal,
                  size: 21,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      cards[index].$1,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.heading,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      cards[index].$2,
                      style: const TextStyle(
                        fontSize: 12,
                        height: 1.3,
                        color: AppTheme.muted,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 20, color: AppTheme.muted),
            ],
          ),
        ),
        if (index != cards.length - 1) const SizedBox(height: 12),
      ],
    ];
  }
}

class _AppointmentCard extends StatelessWidget {
  const _AppointmentCard({required this.onDetails});
  final VoidCallback onDetails;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      decoration: BoxDecoration(
        color: const Color(0xFF068A98),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'NEXT APPOINTMENT',
                style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 0.4,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFFBEF2F4),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  'Confirmed',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF068A98),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Wed, Nov 4 • 10:00 AM',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Checkup for Luna • Dr. Rachel Carter',
            style: TextStyle(fontSize: 12, color: Color(0xFFD8F6F7)),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton(
              onPressed: onDetails,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: const Color(0xFF068A98),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                'View details',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReminderCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 14, 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF5FBFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFDDEBED)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(
              Icons.notifications_none_outlined,
              size: 20,
              color: Color(0xFF068A98),
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              "Reminder: Luna's checkup is in 7 days. We'll notify you again the day before.",
              style: TextStyle(
                fontSize: 12,
                height: 1.35,
                color: AppTheme.heading,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    this.badge,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String? badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        height: 100,
        padding: const EdgeInsets.fromLTRB(12, 12, 10, 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE1E4E7)),
        ),
        child: Stack(
          children: [
            Positioned(
              left: 0,
              top: 0,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFDBF5F8),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(icon, size: 22, color: const Color(0xFF068A98)),
              ),
            ),
            if (badge != null)
              Positioned(
                right: 0,
                top: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F6E8),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    badge!,
                    style: const TextStyle(
                      fontSize: 10,
                      color: Color(0xFF5B7A1E),
                    ),
                  ),
                ),
              ),
            Positioned(
              left: 0,
              right: 0,
              bottom: 8,
              child: Text(
                title,
                maxLines: 2,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  height: 1.15,
                  color: AppTheme.heading,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PetCard extends StatelessWidget {
  const _PetCard({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE1E4E7)),
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: const BoxDecoration(
                color: Color(0xFFF0F1F2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.pets, color: Color(0xFF068A98)),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Luna',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    'Golden Retriever • Female • 2 yrs, 4\nmos',
                    style: TextStyle(
                      fontSize: 12,
                      height: 1.25,
                      color: AppTheme.muted,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF3D474B)),
          ],
        ),
      ),
    );
  }
}
