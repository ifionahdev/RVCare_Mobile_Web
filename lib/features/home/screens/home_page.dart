import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../../appointments/screens/book_appointment_flow.dart';
import '../../appointments/data/appointment_service.dart';
import '../../pets/screens/manage_pet_profile_screen.dart';
import '../../pets/screens/my_pets_screen.dart';
import '../../appointments/screens/appointment_details_screen.dart';
import '../../../core/network/realtime_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, this.onNavigate});

  final ValueChanged<int>? onNavigate;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Map<String, dynamic>? _upcomingAppointment;
  List<AppointmentPet> _pets = [];
  static const Color _teal = Color(0xFF068A98);
  int _realtimeRevision = -1;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUpcoming();
      _loadPets();
    });
  }

  Future<void> _loadPets() async {
    try {
      final pets = await context.read<AppointmentService>().fetchUserPets();
      if (!mounted) return;
      setState(() => _pets = pets);
    } catch (_) {}
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final revision = context.watch<RealtimeProvider>().revision;
    if (_realtimeRevision != revision) {
      _realtimeRevision = revision;
      if (revision >= 0) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) _loadUpcoming();
        });
      }
    }
  }

  Future<void> _loadUpcoming() async {
    try {
      final appointments = await context
          .read<AppointmentService>()
          .fetchAppointments();
      final upcoming =
          appointments
              .where(
                (item) =>
                    item['status'] == 'Pending' || item['status'] == 'Incoming',
              )
              .toList()
            ..sort(
              (a, b) => (a['scheduledDate'] as String).compareTo(
                b['scheduledDate'] as String,
              ),
            );
      if (!mounted) return;
      setState(
        () => _upcomingAppointment = upcoming.isEmpty ? null : upcoming.first,
      );
    } catch (_) {}
  }

  void _openBooking() {
    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(builder: (_) => const BookAppointmentFlow()),
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
    return Scaffold(backgroundColor: Colors.white, body: _buildHome());
  }

  Widget _buildHome() {
    final auth = context.watch<AuthProvider>();
    final userName = _userName(auth.user);
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Good morning'
        : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

    return SafeArea(
      top: true,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              greeting,
              style: const TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Hello${userName.isEmpty ? '' : ', $userName'}',
                    style: const TextStyle(
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
                  child: Text(
                    _userInitials(userName),
                    style: const TextStyle(
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
              appointment: _upcomingAppointment,
              onDetails: () => _openUpcomingDetails(),
            ),
            const SizedBox(height: 12),
            _ReminderCard(appointment: _upcomingAppointment),
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
                    onTap: () => widget.onNavigate?.call(2),
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
                    onTap: () => widget.onNavigate?.call(3),
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
              pet: _pets.isEmpty ? null : _pets.first,
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

  String _userName(Map<String, dynamic>? user) {
    if (user == null) return '';
    final firstName = user['firstName']?.toString().trim() ?? '';
    final lastName = user['lastName']?.toString().trim() ?? '';
    final name = '$firstName $lastName'.trim();
    if (name.isNotEmpty) return name;
    return user['name']?.toString().trim() ??
        user['username']?.toString().trim() ??
        '';
  }

  String _userInitials(String name) {
    final parts = name
        .trim()
        .split(RegExp(r'\s+'))
        .where((part) => part.isNotEmpty);
    if (parts.isEmpty) return 'U';
    return parts.take(2).map((part) => part[0].toUpperCase()).join();
  }

  String _monthName(int month) {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return months[month - 1];
  }

  String _formatAppointmentTime(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty) return '';
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(raw);
    if (match == null) return raw;
    var hour = int.parse(match.group(1)!);
    final minute = int.parse(match.group(2)!);
    final period = hour >= 12 ? 'PM' : 'AM';
    if (hour == 0) {
      hour = 12;
    } else if (hour > 12) {
      hour -= 12;
    }
    return '$hour:${minute.toString().padLeft(2, '0')} $period';
  }

  void _openUpcomingDetails() {
    final appointment = _upcomingAppointment;
    if (appointment == null) return;

    final date = DateTime.parse(appointment['scheduledDate'] as String);
    final pet = appointment['pet'] as Map<String, dynamic>;
    final service = appointment['service'] as Map<String, dynamic>;
    final timeslot = appointment['timeslot'] as Map<String, dynamic>;
    final veterinarian = appointment['veterinarian'] as Map<String, dynamic>;
    final account = veterinarian['account'] as Map<String, dynamic>;
    final status = appointment['status'] == 'Incoming'
        ? 'Confirmed'
        : appointment['status'] as String;

    Navigator.push<void>(
      context,
      MaterialPageRoute<void>(
        builder: (_) => AppointmentDetailsScreen(
          date: '${_monthName(date.month)} ${date.day}',
          procedure: service['serviceName'] as String,
          pet: pet['petName'] as String,
          time: _formatAppointmentTime(timeslot['startTime']),
          veterinarian: 'Dr. ${account['firstName']} ${account['lastName']}',
          status: status,
          reference: 'APT-${appointment['appointmentId']}',
          appointmentId: appointment['appointmentId'] as int,
        ),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  const _AppointmentCard({required this.onDetails, this.appointment});
  final VoidCallback onDetails;
  final Map<String, dynamic>? appointment;

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
                child: Text(
                  _appointmentStatusLabel(appointment),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF068A98),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            appointment == null
                ? 'No upcoming appointment'
                : '${_formatAppointmentDate(appointment!['scheduledDate'])} • ${_formatAppointmentTime(appointment!['timeslot']['startTime'])}',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            appointment == null
                ? 'Book an appointment to see it here'
                : '${appointment!['service']['serviceName']} for ${appointment!['pet']['petName']} • Dr. ${appointment!['veterinarian']['account']['firstName']} ${appointment!['veterinarian']['account']['lastName']}',
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

  String _formatAppointmentTime(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty) return '';
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(raw);
    if (match == null) return raw;

    var hour = int.parse(match.group(1)!);
    final minute = int.parse(match.group(2)!);
    final period = hour >= 12 ? 'PM' : 'AM';
    if (hour == 0) hour = 12;
    if (hour > 12) hour -= 12;
    return '$hour:${minute.toString().padLeft(2, '0')} $period';
  }

  String _appointmentStatusLabel(Map<String, dynamic>? appointment) {
    if (appointment == null) return 'No appointment';
    final status = appointment['status']?.toString() ?? '';
    if (status == 'Incoming') return 'Confirmed';
    if (status == 'Pending') return 'Pending';
    if (status.isEmpty) return 'Unknown';
    return status;
  }

  String _formatAppointmentDate(dynamic value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty) return '';
    try {
      final date = DateTime.parse(raw);
      return '${_monthName(date.month)} ${date.day}';
    } catch (_) {
      return raw;
    }
  }

  String _monthName(int month) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[month - 1];
  }

}

class _ReminderCard extends StatelessWidget {
  const _ReminderCard({required this.appointment});

  final Map<String, dynamic>? appointment;

  String _reminderText(Map<String, dynamic>? appointment) {
    if (appointment == null) {
      return 'No upcoming appointment reminder yet. Book an appointment to stay on schedule.';
    }

    final pet = appointment['pet'] as Map<String, dynamic>;
    final service = appointment['service'] as Map<String, dynamic>;
    final appointmentDate = DateTime.parse(
      appointment['scheduledDate'] as String,
    );
    final today = DateTime.now();
    final difference = DateTime(
      appointmentDate.year,
      appointmentDate.month,
      appointmentDate.day,
    ).difference(DateTime(today.year, today.month, today.day)).inDays;
    final when = difference <= 0
        ? 'today'
        : difference == 1
        ? 'tomorrow'
        : 'in $difference days';
    return "Reminder: ${pet['petName']}'s ${service['serviceName']} is $when.";
  }

  @override
  Widget build(BuildContext context) {
    final text = _reminderText(appointment);
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
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
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
  const _PetCard({required this.onTap, this.pet});
  final VoidCallback onTap;
  final AppointmentPet? pet;

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
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    pet?.name ?? 'No pets yet',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.heading,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    pet == null
                        ? 'Add a pet to see it here'
                        : '${pet!.breed} • ${pet!.gender}',
                    style: const TextStyle(
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
