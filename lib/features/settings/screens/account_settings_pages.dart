import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../auth/providers/auth_provider.dart';
import '../data/settings_service.dart';

const _settingsBackground = Color(0xFFF4F8F8);
const _settingsHeading = Color(0xFF202D3E);
const _settingsMuted = Color(0xFF718399);
const _settingsTeal = Color(0xFF078891);
const _settingsBorder = Color(0xFFDCE9EC);
const _settingsMint = Color(0xFFDFF3F0);

class PersonalInformationScreen extends StatefulWidget {
  const PersonalInformationScreen({super.key});

  @override
  State<PersonalInformationScreen> createState() =>
      _PersonalInformationScreenState();
}

class _PersonalInformationScreenState extends State<PersonalInformationScreen> {
  late final TextEditingController _firstName;
  late final TextEditingController _lastName;
  late final TextEditingController _birthday;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _loadError;

  @override
  void initState() {
    super.initState();
    _firstName = TextEditingController();
    _lastName = TextEditingController();
    _birthday = TextEditingController();
    unawaited(_loadProfile());
  }

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _birthday.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await context.read<SettingsService>().fetchMyProfile();
      if (!mounted) return;
      setState(() {
        _firstName.text = profile.firstName;
        _lastName.text = profile.lastName;
        _birthday.text = _displayBirthday(profile.dateOfBirth);
        _isLoading = false;
      });
    } on DioException catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = SettingsService.readableError(error);
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = error.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _displayBirthday(DateTime? date) {
    if (date == null) return '';
    return '${date.month.toString().padLeft(2, '0')} / '
        '${date.day.toString().padLeft(2, '0')} / ${date.year}';
  }

  DateTime? _selectedBirthday() {
    if (_birthday.text.trim().isEmpty) return null;
    final parts = _birthday.text.split('/');
    if (parts.length != 3) return null;
    final month = int.tryParse(parts[0].trim());
    final day = int.tryParse(parts[1].trim());
    final year = int.tryParse(parts[2].trim());
    if (month == null || day == null || year == null) return null;
    final date = DateTime(year, month, day);
    if (date.year != year || date.month != month || date.day != day) {
      return null;
    }
    return date;
  }

  Future<void> _selectBirthday() async {
    final initialDate = _selectedBirthday() ?? DateTime(2000);
    final date = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (date == null) return;
    setState(() {
      _birthday.text = _displayBirthday(date);
    });
  }

  Future<void> _save() async {
    final firstName = _firstName.text.trim();
    final lastName = _lastName.text.trim();
    final birthday = _selectedBirthday();
    if (firstName.isEmpty ||
        lastName.isEmpty ||
        (_birthday.text.trim().isNotEmpty && birthday == null)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enter valid names and a valid birthday.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      await context.read<SettingsService>().updateMyProfile(
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: birthday == null
            ? null
            : '${birthday.year.toString().padLeft(4, '0')}-'
                  '${birthday.month.toString().padLeft(2, '0')}-'
                  '${birthday.day.toString().padLeft(2, '0')}',
      );
      if (!mounted) return;
      context.read<AuthProvider>().updateUserProfile(
        firstName: firstName,
        lastName: lastName,
      );
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Personal information updated.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on DioException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(SettingsService.readableError(error)),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SettingsDetailPage(
      title: 'Personal information',
      bottomAction: _SettingsPrimaryButton(
        label: 'Save changes',
        onPressed: _isLoading || _isSaving || _loadError != null ? null : _save,
        isLoading: _isSaving,
      ),
      children: [
        const _SettingsIntro(
          title: 'A little about you',
          description: 'Keep your pet-owner information up to date.',
        ),
        const SizedBox(height: 26),
        if (_isLoading)
          const Center(child: CircularProgressIndicator())
        else if (_loadError != null)
          _SettingsNotice(
            icon: Icons.error_outline_rounded,
            message: _loadError!,
          ),
        const _SettingsSectionLabel('PET OWNER DETAILS'),
        const SizedBox(height: 16),
        _SettingsFormField(
          label: 'First name',
          controller: _firstName,
          hintText: 'Enter your first name',
        ),
        const SizedBox(height: 18),
        _SettingsFormField(
          label: 'Last name',
          controller: _lastName,
          hintText: 'Enter your last name',
        ),
        const SizedBox(height: 18),
        _SettingsFormField(
          label: 'Birthday',
          controller: _birthday,
          hintText: 'MM / DD / YYYY',
          readOnly: true,
          onTap: _selectBirthday,
          suffixIcon: const Icon(
            Icons.calendar_month_outlined,
            color: _settingsMuted,
            size: 20,
          ),
        ),
        const SizedBox(height: 24),
        const _SettingsNotice(
          icon: Icons.person_outline_rounded,
          message: 'These are your details, not your pet’s. You can update pet information in My pets.',
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}

class PreferencesScreen extends StatefulWidget {
  const PreferencesScreen({super.key});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  bool _emailNotifications = true;
  bool _isLoading = true;
  bool _isSaving = false;
  Object? _loadError;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    setState(() {
      _isLoading = true;
      _loadError = null;
    });
    try {
      final preferences = await context
          .read<SettingsService>()
          .fetchNotificationPreferences();
      if (!mounted) return;
      setState(() {
        _emailNotifications = preferences.emailNotifications;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadError = error;
        _isLoading = false;
      });
    }
  }

  Future<void> _save() async {
    final settingsService = context.read<SettingsService>();
    setState(() => _isSaving = true);
    try {
      await settingsService.updateNotificationPreferences(
        emailNotifications: _emailNotifications,
      );

      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Email notification preference saved.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      final message = error is DioException
          ? SettingsService.readableError(error)
          : error.toString().replaceFirst('Exception: ', '');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SettingsDetailPage(
      title: 'Preferences',
      bottomAction: _SettingsPrimaryButton(
        label: 'Save preferences',
        onPressed: _isLoading || _isSaving ? null : _save,
        isLoading: _isSaving,
      ),
      children: [
        const _SettingsIntro(
          title: 'Stay in touch, your way',
          description:
              'Choose which Raphacare notifications you’d like to receive.',
        ),
        const SizedBox(height: 26),
        const _SettingsSectionLabel('NOTIFICATION CHOICES'),
        const SizedBox(height: 14),
        if (_isLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(color: _settingsTeal),
            ),
          )
        else if (_loadError != null)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _loadError is DioException
                    ? SettingsService.readableError(_loadError as DioException)
                    : _loadError.toString(),
                style: const TextStyle(color: _settingsMuted),
              ),
              TextButton(
                onPressed: _loadPreferences,
                child: const Text('Try again'),
              ),
            ],
          )
        else ...[
          _PreferenceCard(
            icon: Icons.mail_outline_rounded,
            title: 'Email notifications',
            description: 'Receive appointment and pet-record updates from your clinic by email.',
            value: _emailNotifications,
            onChanged: (value) {
              if (!_isSaving) {
                setState(() => _emailNotifications = value);
              }
            },
          ),
          const SizedBox(height: 20),
          const _SettingsNotice(
            icon: Icons.notifications_none_rounded,
            message: 'When enabled, appointment and record updates are sent to your email address.',
          ),
          const SizedBox(height: 28),
        ],
      ],
    );
  }
}

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _obscure = [true, true, true];
  bool _isSaving = false;

  @override
  void dispose() {
    _currentPassword.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _updatePassword() async {
    String? message;
    if (_currentPassword.text.isEmpty ||
        _newPassword.text.isEmpty ||
        _confirmPassword.text.isEmpty) {
      message = 'Enter your current password and both new password fields.';
    } else if (_newPassword.text.length < 8 ||
        _newPassword.text.length > 72 ||
        !RegExp(r'[A-Z]').hasMatch(_newPassword.text) ||
        !RegExp(r'\d').hasMatch(_newPassword.text) ||
        !RegExp(r'[^A-Za-z0-9]').hasMatch(_newPassword.text)) {
      message = 'Use 8–72 characters, including an uppercase letter, a number, and a special character.';
    } else if (_newPassword.text == _currentPassword.text) {
      message = 'Choose a password different from your current password.';
    } else if (_newPassword.text != _confirmPassword.text) {
      message = 'The new passwords do not match.';
    }
    if (message != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      await context.read<SettingsService>().changePassword(
        currentPassword: _currentPassword.text,
        newPassword: _newPassword.text,
        confirmPassword: _confirmPassword.text,
      );
      if (!mounted) return;
      _currentPassword.clear();
      _newPassword.clear();
      _confirmPassword.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password changed successfully.'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } on DioException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(SettingsService.readableError(error)),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return _SettingsDetailPage(
      title: 'Change password',
      bottomAction: _SettingsPrimaryButton(
        label: 'Update password',
        onPressed: _isSaving ? null : _updatePassword,
        isLoading: _isSaving,
      ),
      children: [
        const SizedBox(height: 24),
        const Text(
          'Enter your current password, then choose a new password for your account.',
          style: TextStyle(color: _settingsMuted, fontSize: 14, height: 1.4),
        ),
        const SizedBox(height: 24),
        _PasswordField(
          label: 'Current password',
          controller: _currentPassword,
          obscureText: _obscure[0],
          onToggleVisibility: () => setState(() => _obscure[0] = !_obscure[0]),
        ),
        const SizedBox(height: 18),
        _PasswordField(
          label: 'New password',
          controller: _newPassword,
          obscureText: _obscure[1],
          onToggleVisibility: () => setState(() => _obscure[1] = !_obscure[1]),
        ),
        const SizedBox(height: 18),
        _PasswordField(
          label: 'Confirm new password',
          controller: _confirmPassword,
          obscureText: _obscure[2],
          onToggleVisibility: () => setState(() => _obscure[2] = !_obscure[2]),
        ),
        const SizedBox(height: 24),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(18),
          decoration: _settingsCardDecoration(),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SettingsSectionLabel('PASSWORD MUST HAVE'),
              SizedBox(height: 14),
              _PasswordRequirement('Between 8 and 72 characters'),
              SizedBox(height: 12),
              _PasswordRequirement(
                'An uppercase letter, a number, and a special character',
              ),
              SizedBox(height: 12),
              _PasswordRequirement('Different from your current password'),
              SizedBox(height: 12),
              _PasswordRequirement('Both new passwords must match'),
            ],
          ),
        ),
        const SizedBox(height: 28),
      ],
    );
  }
}

class ActivityLogScreen extends StatefulWidget {
  const ActivityLogScreen({super.key});

  @override
  State<ActivityLogScreen> createState() => _ActivityLogScreenState();
}

class _ActivityLogScreenState extends State<ActivityLogScreen> {
  late Future<List<AccountActivity>> _activityFuture;

  @override
  void initState() {
    super.initState();
    _activityFuture = context.read<SettingsService>().fetchActivity();
  }

  String _dateHeading(DateTime date) {
    const months = [
      'JANUARY',
      'FEBRUARY',
      'MARCH',
      'APRIL',
      'MAY',
      'JUNE',
      'JULY',
      'AUGUST',
      'SEPTEMBER',
      'OCTOBER',
      'NOVEMBER',
      'DECEMBER',
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  String _timeLabel(DateTime date) {
    final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour < 12 ? 'AM' : 'PM';
    return '$hour:$minute $period';
  }

  IconData _activityIcon(String title) {
    final normalized = title.toLowerCase();
    if (normalized.contains('sign')) return Icons.login_rounded;
    if (normalized.contains('password')) return Icons.lock_outline_rounded;
    if (normalized.contains('delete')) return Icons.delete_outline_rounded;
    return Icons.manage_accounts_outlined;
  }

  @override
  Widget build(BuildContext context) {
    return _SettingsDetailPage(
      title: 'Activity log',
      children: [
        const SizedBox(height: 24),
        const Text(
          'A timeline of sign-ins and changes to your account.',
          style: TextStyle(color: _settingsMuted, fontSize: 14, height: 1.4),
        ),
        const SizedBox(height: 26),
        FutureBuilder<List<AccountActivity>>(
          future: _activityFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }
            if (snapshot.hasError) {
              final error = snapshot.error;
              final message = error is DioException
                  ? SettingsService.readableError(error)
                  : error.toString().replaceFirst('Exception: ', '');
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(message, style: const TextStyle(color: _settingsMuted)),
                  TextButton(
                    onPressed: () => setState(
                      () => _activityFuture = context
                          .read<SettingsService>()
                          .fetchActivity(),
                    ),
                    child: const Text('Try again'),
                  ),
                ],
              );
            }

            final activities = snapshot.data ?? const <AccountActivity>[];
            if (activities.isEmpty) {
              return const _SettingsNotice(
                icon: Icons.history_rounded,
                message: 'No account activity is available yet.',
              );
            }

            final children = <Widget>[];
            DateTime? previousDate;
            for (final activity in activities) {
              final date = activity.createdAt.toLocal();
              final day = DateTime(date.year, date.month, date.day);
              if (previousDate != day) {
                if (children.isNotEmpty) {
                  children.add(const SizedBox(height: 22));
                }
                children.add(_SettingsSectionLabel(_dateHeading(day)));
                children.add(const SizedBox(height: 12));
                previousDate = day;
              } else {
                children.add(const SizedBox(height: 12));
              }
              children.add(
                _ActivityCard(
                  icon: _activityIcon(activity.title),
                  title: activity.title,
                  detail: activity.detail,
                  time: _timeLabel(date),
                ),
              );
            }
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: children,
            );
          },
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _SettingsDetailPage(
      title: 'Privacy policy',
      children: [
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFFFF0BE),
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Text(
            'Draft for clinic review',
            style: TextStyle(
              color: _settingsTeal,
              fontSize: 12,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text(
          'Your information & care',
          style: TextStyle(
            color: _settingsHeading,
            fontSize: 24,
            height: 1.1,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 12),
        const Text(
          'This provisional summary describes intended data use. It is not an approved legal policy.',
          style: TextStyle(color: _settingsMuted, fontSize: 14, height: 1.45),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: _settingsCardDecoration(),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _PrivacySection(
                title: 'Information about you and your pet',
                body: 'Owner information may include your name, birthday, contact details and account preferences. Pet records may include pet profiles, appointment details and care information shared with your clinic.',
              ),
              _PrivacySection(
                title: 'How information is used',
                body: 'This information helps the clinic coordinate care, manage bookings, maintain pet records and send relevant service messages. Account details also help support your use of Raphacare.',
              ),
              _PrivacySection(
                title: 'Sharing for care and services',
                body: 'Information may be shared with your clinic and service providers as needed to deliver care, manage appointments and operate the app. The clinic should confirm its sharing practices in the approved policy.',
              ),
              _PrivacySection(
                title: 'Your notification choices',
                body: 'You can review email and app-update notification choices in Settings → Preferences. These choices help you manage how you hear from Raphacare.',
              ),
              _PrivacySection(
                title: 'Questions and privacy requests',
                body: 'For questions about your information, or to request access or corrections, contact your clinic through its usual contact channels. The clinic can explain the options available to you.',
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        const Row(
          children: [
            Icon(
              Icons.pending_actions_rounded,
              color: _settingsMuted,
              size: 20,
            ),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Final wording and policy details are pending clinic approval.',
                style: TextStyle(color: _settingsMuted, fontSize: 13),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

class _SettingsDetailPage extends StatelessWidget {
  const _SettingsDetailPage({
    required this.title,
    required this.children,
    this.bottomAction,
  });

  final String title;
  final List<Widget> children;
  final Widget? bottomAction;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _settingsBackground,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
              child: _SettingsPageHeader(title: title),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: children,
                ),
              ),
            ),
            if (bottomAction != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 18),
                child: bottomAction!,
              ),
          ],
        ),
      ),
    );
  }
}

class _SettingsPageHeader extends StatelessWidget {
  const _SettingsPageHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 48,
      child: Row(
        children: [
          Material(
            color: Colors.white,
            shape: const CircleBorder(),
            child: InkWell(
              onTap: () => Navigator.pop(context),
              customBorder: const CircleBorder(),
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: _settingsBorder, width: 1.5),
                ),
                child: const Icon(
                  Icons.arrow_back_rounded,
                  color: _settingsHeading,
                  size: 22,
                ),
              ),
            ),
          ),
          Expanded(
            child: Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: _settingsHeading,
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }
}

class _SettingsIntro extends StatelessWidget {
  const _SettingsIntro({required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            color: _settingsHeading,
            fontSize: 24,
            height: 1.1,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          description,
          style: const TextStyle(
            color: _settingsMuted,
            fontSize: 14,
            height: 1.4,
          ),
        ),
      ],
    );
  }
}

class _SettingsSectionLabel extends StatelessWidget {
  const _SettingsSectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(
        color: _settingsMuted,
        fontSize: 13,
        fontWeight: FontWeight.w800,
        letterSpacing: 0.6,
      ),
    );
  }
}

class _SettingsFormField extends StatelessWidget {
  const _SettingsFormField({
    required this.label,
    required this.controller,
    required this.hintText,
    this.readOnly = false,
    this.onTap,
    this.suffixIcon,
  });

  final String label;
  final TextEditingController controller;
  final String hintText;
  final bool readOnly;
  final VoidCallback? onTap;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _settingsHeading,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          readOnly: readOnly,
          onTap: onTap,
          style: const TextStyle(color: _settingsHeading, fontSize: 15),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(color: _settingsMuted),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 18,
              vertical: 18,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: _settingsBorder, width: 1.3),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: _settingsTeal, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class _SettingsNotice extends StatelessWidget {
  const _SettingsNotice({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: _settingsMint,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: _settingsTeal, size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: _settingsTeal,
                fontSize: 14,
                height: 1.4,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsPrimaryButton extends StatelessWidget {
  const _SettingsPrimaryButton({
    required this.label,
    required this.onPressed,
    this.isLoading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: _settingsTeal,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: isLoading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(
                label,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
      ),
    );
  }
}

class _PreferenceCard extends StatelessWidget {
  const _PreferenceCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.value,
    required this.onChanged,
  });

  final IconData icon;
  final String title;
  final String description;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: _settingsCardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _SettingsIconBox(icon: icon),
              const Spacer(),
              Text(
                value ? 'On' : 'Off',
                style: TextStyle(
                  color: value ? _settingsTeal : _settingsMuted,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Switch(
                value: value,
                onChanged: onChanged,
                activeTrackColor: _settingsTeal,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: _settingsHeading,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            style: const TextStyle(
              color: _settingsMuted,
              fontSize: 14,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

class _PasswordField extends StatelessWidget {
  const _PasswordField({
    required this.label,
    required this.controller,
    required this.obscureText,
    required this.onToggleVisibility,
  });

  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final VoidCallback onToggleVisibility;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _settingsHeading,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscureText,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.lock_outline_rounded, size: 20),
            suffixIcon: IconButton(
              onPressed: onToggleVisibility,
              icon: Icon(
                obscureText
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
              ),
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 17,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: _settingsBorder, width: 1.3),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(18),
              borderSide: const BorderSide(color: _settingsTeal, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class _PasswordRequirement extends StatelessWidget {
  const _PasswordRequirement(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 21,
          height: 21,
          decoration: const BoxDecoration(
            color: _settingsMint,
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_rounded,
            color: _settingsTeal,
            size: 15,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            softWrap: true,
            style: const TextStyle(color: _settingsTeal, fontSize: 13),
          ),
        ),
      ],
    );
  }
}

class _ActivityCard extends StatelessWidget {
  const _ActivityCard({
    required this.icon,
    required this.title,
    required this.detail,
    required this.time,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String time;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: _settingsCardDecoration(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SettingsIconBox(icon: icon),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: _settingsHeading,
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  detail,
                  style: const TextStyle(color: _settingsMuted, fontSize: 13),
                ),
                const SizedBox(height: 5),
                Text(
                  time,
                  style: const TextStyle(color: _settingsTeal, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PrivacySection extends StatelessWidget {
  const _PrivacySection({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 22),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: _settingsHeading,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: const TextStyle(
              color: _settingsMuted,
              fontSize: 13,
              height: 1.45,
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingsIconBox extends StatelessWidget {
  const _SettingsIconBox({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      decoration: BoxDecoration(
        color: _settingsMint,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Icon(icon, color: _settingsTeal, size: 22),
    );
  }
}

BoxDecoration _settingsCardDecoration() {
  return BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(20),
    border: Border.all(color: _settingsBorder, width: 1.3),
  );
}
