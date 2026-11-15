import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/appointment_service.dart';
import 'recommended_schedules_screen.dart';

class RescheduleAppointmentScreen extends StatefulWidget {
  const RescheduleAppointmentScreen({
    super.key,
    required this.date,
    required this.scheduledDate,
    required this.procedure,
    required this.pet,
    required this.time,
    required this.veterinarian,
    required this.appointmentId,
    required this.petId,
    required this.serviceId,
    required this.veterinarianId,
    this.reference,
  });

  /// Current appointment date, e.g. "Wed, Nov 4".
  final String date;
  final String scheduledDate;
  final String procedure;
  final String pet;

  /// Current appointment start time, e.g. "10:00 AM".
  final String time;
  final String veterinarian;
  final int appointmentId;
  final int petId;
  final int serviceId;
  final int veterinarianId;
  final String? reference;

  @override
  State<RescheduleAppointmentScreen> createState() =>
      _RescheduleAppointmentScreenState();
}

class _RescheduleAppointmentScreenState
    extends State<RescheduleAppointmentScreen> {
  static const Color _pageBg = Color(0xFFF4F9FC);
  static const Color _fieldBg = Color(0xFFEEF3F5);
  static const Color _selectedBg = Color(0xFFDDF1F5);
  static const Color _disabledText = Color(0xFF9AA7B3);

  late final List<DateTime> _dates;
  int _selectedDate = 0;
  String? _selectedTime;
  List<AppointmentTimeslot> _slots = const [];
  bool _isLoadingAvailability = false;
  bool _isSubmitting = false;
  Object? _availabilityError;
  int _availabilityRequest = 0;

  String _dateQueryValue(DateTime date) =>
      '${date.year.toString().padLeft(4, '0')}-'
      '${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';

  String _dateLabel(int index) {
    final date = _dates[index];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${weekdays[date.weekday - 1]}, ${months[date.month - 1]} ${date.day}';
  }

  DateTime get _selectedDateTime => _dates[_selectedDate];

  List<DateTime> _availableDates() {
    final today = DateUtils.dateOnly(DateTime.now());
    final dates = <DateTime>[];
    for (var daysAhead = 1; daysAhead <= 90 && dates.length < 6; daysAhead++) {
      final date = today.add(Duration(days: daysAhead));
      if (_dateQueryValue(date) != widget.scheduledDate) dates.add(date);
    }
    return dates;
  }

  AppointmentTimeslot? get _selectedSlot {
    for (final slot in _slots) {
      if (slot.display == _selectedTime) return slot;
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _dates = _availableDates();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _loadAvailability();
    });
  }

  Future<void> _loadAvailability() async {
    final request = ++_availabilityRequest;
    setState(() {
      _isLoadingAvailability = true;
      _selectedTime = null;
      _availabilityError = null;
    });
    try {
      final slots = await context.read<AppointmentService>().fetchAvailability(
        date: _selectedDateTime,
        vetId: widget.veterinarianId,
      );
      if (!mounted || request != _availabilityRequest) return;
      setState(() {
        _slots = slots;
        _isLoadingAvailability = false;
      });
    } catch (error) {
      if (!mounted || request != _availabilityRequest) return;
      setState(() {
        _slots = const [];
        _isLoadingAvailability = false;
        _availabilityError = error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _pageBg,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
                children: [
                  _buildTopBar(context),
                  const SizedBox(height: 20),
                  _buildCurrentCard(),
                  const SizedBox(height: 12),
                  _buildDateCard(),
                  const SizedBox(height: 16),
                  _sectionLabel('ASSIGNED VETERINARIAN'),
                  const SizedBox(height: 8),
                  _assignedVeterinarianCard(),
                  const SizedBox(height: 16),
                  _sectionLabel('NEW TIME · 1 HR EACH'),
                  const SizedBox(height: 8),
                  _buildTimeGrid(context),
                  const SizedBox(height: 16),
                  _buildSummaryCard(),
                  const SizedBox(height: 14),
                  const Text(
                    'Free to reschedule up to 24 hours before your visit. '
                    'The clinic will re-confirm your new time.',
                    style: TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: AppTheme.muted,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
              child: SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _selectedSlot == null || _isSubmitting
                      ? null
                      : _confirmReschedule,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryDark,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    _isSubmitting ? 'Saving...' : 'Confirm New Time',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmReschedule() async {
    final selectedSlot = _selectedSlot;
    if (selectedSlot == null || selectedSlot.isBooked || _isSubmitting) return;

    setState(() => _isSubmitting = true);
    try {
      await context.read<AppointmentService>().rescheduleAppointment(
        appointmentId: widget.appointmentId,
        scheduledDate: _dateQueryValue(_selectedDateTime),
        timeslotId: selectedSlot.timeslotId,
      );
      if (!mounted) return;
      Navigator.popUntil(context, (route) => route.isFirst);
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(error.toString())));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _openRecommendedSchedule(String preferredTime) {
    Navigator.push(
      context,
      MaterialPageRoute<void>(
        builder: (_) => RecommendedSchedulesScreen(
          pet: widget.pet,
          procedure: widget.procedure,
          preferredDate: _dateLabel(_selectedDate),
          preferredTime: preferredTime,
          veterinarian: widget.veterinarian,
          petId: widget.petId,
          serviceId: widget.serviceId,
          preferredVetId: widget.veterinarianId,
          algorithmDate: _dateQueryValue(_selectedDateTime),
          rescheduleAppointmentId: widget.appointmentId,
        ),
      ),
    );
  }

  // ---------------------------------------------------------------- top bar

  Widget _buildTopBar(BuildContext context) {
    return SizedBox(
      height: 40,
      child: Row(
        children: [
          Material(
            color: Colors.white,
            shape: const CircleBorder(side: BorderSide(color: AppTheme.border)),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => Navigator.maybePop(context),
              child: const SizedBox(
                width: 40,
                height: 40,
                child: Icon(
                  Icons.arrow_back,
                  size: 20,
                  color: AppTheme.heading,
                ),
              ),
            ),
          ),
          const Expanded(
            child: Text(
              'Reschedule',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppTheme.heading,
              ),
            ),
          ),
          // Keeps the title visually centered.
          const SizedBox(width: 40),
        ],
      ),
    );
  }

  // ----------------------------------------------------------- current card

  Widget _buildCurrentCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE0F2F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFBFE3EA)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'CURRENT APPOINTMENT',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
              color: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            '${widget.procedure} for ${widget.pet}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${widget.date} · ${widget.time} · ${widget.veterinarian}',
            style: const TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
          if (widget.reference != null) ...[
            const SizedBox(height: 8),
            Text(
              widget.reference!,
              style: const TextStyle(fontSize: 12, color: AppTheme.muted),
            ),
          ],
        ],
      ),
    );
  }

  // -------------------------------------------------------------- date card

  Widget _buildDateCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('PICK A NEW DATE'),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                for (var i = 0; i < _dates.length; i++) ...[
                  if (i != 0) const SizedBox(width: 8),
                  SizedBox(width: 52, child: _dateChip(i)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _dateChip(int index) {
    final selected = _selectedDate == index;

    final chip = Container(
      height: 64,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: selected ? _selectedBg : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: selected ? AppTheme.primaryDark : AppTheme.border,
          width: selected ? 2 : 1,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _dateLabel(index).split(',').first,
            style: TextStyle(
              fontSize: 12,
              fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              color: selected ? AppTheme.primaryDark : AppTheme.muted,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _dates[index].day.toString(),
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
        ],
      ),
    );

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: selected
          ? null
          : () {
              setState(() => _selectedDate = index);
              _loadAvailability();
            },
      child: chip,
    );
  }

  Widget _assignedVeterinarianCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.person_outline, color: AppTheme.primaryDark),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              widget.veterinarian,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w800,
                color: AppTheme.heading,
              ),
            ),
          ),
          const Icon(Icons.lock_outline, size: 18, color: AppTheme.muted),
        ],
      ),
    );
  }

  // -------------------------------------------------------------- time grid

  Widget _buildTimeGrid(BuildContext context) {
    const gap = 10.0;
    final itemWidth = (MediaQuery.sizeOf(context).width - 40 - gap * 2) / 3;

    if (_isLoadingAvailability) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_availabilityError != null) {
      return Column(
        children: [
          Text(
            'Unable to load availability: $_availabilityError',
            style: const TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
          TextButton(
            onPressed: _loadAvailability,
            child: const Text('Try again'),
          ),
        ],
      );
    }
    if (_slots.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'No available time slots for this date and veterinarian.',
            style: TextStyle(fontSize: 13, color: AppTheme.muted),
          ),
          TextButton(
            onPressed: () => _openRecommendedSchedule(widget.time),
            child: const Text('Find recommended times'),
          ),
        ],
      );
    }

    return Wrap(
      spacing: gap,
      runSpacing: gap,
      children: _slots.map((slot) {
        final unavailable = slot.isBooked;
        final selected = slot.display == _selectedTime && !unavailable;

        return SizedBox(
          width: itemWidth,
          height: 44,
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: unavailable
                ? () => _openRecommendedSchedule(slot.display)
                : () => setState(() => _selectedTime = slot.display),
            child: Container(
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: unavailable
                    ? _fieldBg
                    : (selected ? _selectedBg : Colors.white),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: selected ? AppTheme.primaryDark : AppTheme.border,
                  width: selected ? 2 : 1,
                ),
              ),
              child: Text(
                slot.display,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: unavailable
                      ? _disabledText
                      : (selected ? AppTheme.primaryDark : AppTheme.heading),
                  decoration: unavailable ? TextDecoration.lineThrough : null,
                  decorationColor: _disabledText,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  // ----------------------------------------------------------- summary card

  Widget _buildSummaryCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('SUMMARY'),
          const SizedBox(height: 8),
          Text(
            '${widget.date} · ${widget.time}',
            style: const TextStyle(
              fontSize: 13,
              color: AppTheme.muted,
              decoration: TextDecoration.lineThrough,
              decorationColor: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${_dateLabel(_selectedDate)} · ${_selectedTime ?? 'Select a time'}',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: AppTheme.primaryDark,
            ),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------- helpers

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w700,
        letterSpacing: 0.6,
        color: AppTheme.muted,
      ),
    );
  }
}
