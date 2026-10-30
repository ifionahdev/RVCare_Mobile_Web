import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';
import '../models/pet.dart';

class ManagePetProfileScreen extends StatefulWidget {
  const ManagePetProfileScreen({super.key, this.pet});

  final Pet? pet;

  @override
  State<ManagePetProfileScreen> createState() => _ManagePetProfileScreenState();
}

class _ManagePetProfileScreenState extends State<ManagePetProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _breedController;
  late final TextEditingController _ageController;
  late final TextEditingController _weightController;
  final TextEditingController _ownerController = TextEditingController(
    text: 'Sarah Jenkins',
  );

  @override
  void initState() {
    super.initState();
    final pet = widget.pet ?? samplePets.first;
    _nameController = TextEditingController(text: pet.name);
    _breedController = TextEditingController(text: pet.breed);
    _ageController = TextEditingController(text: pet.age);
    _weightController = TextEditingController(text: pet.weight);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _breedController.dispose();
    _ageController.dispose();
    _weightController.dispose();
    _ownerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final pet = widget.pet ?? samplePets.first;

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        leadingWidth: 60,
        leading: Padding(
          padding: const EdgeInsets.only(left: 16),
          child: _CircleButton(
            icon: Icons.arrow_back,
            onPressed: () => Navigator.pop(context),
          ),
        ),
        centerTitle: true,
        title: const Text(
          'Manage Pet Profile',
          style: TextStyle(
            color: AppTheme.heading,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _CircleButton(icon: Icons.more_horiz, onPressed: () {}),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 20),
        children: [
          Center(
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F6F7),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFE0E3E5),
                      width: 5,
                    ),
                  ),
                  child: const Icon(
                    Icons.pets,
                    size: 56,
                    color: Color(0xFF068A98),
                  ),
                ),
                Positioned(
                  right: -8,
                  bottom: 0,
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: const BoxDecoration(
                      color: Color(0xFF068A98),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.camera_alt_outlined,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            pet.name,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w800,
              color: AppTheme.heading,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${pet.breed} - ${pet.gender}',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 14, color: AppTheme.muted),
          ),
          const SizedBox(height: 18),
          _FormCard(
            title: 'PET INFORMATION',
            children: [
              _FormField(label: 'Pet Name', controller: _nameController),
              const SizedBox(height: 14),
              _FormField(label: 'Breed', controller: _breedController),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _FormField(label: 'Age', controller: _ageController),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _FormField(
                      label: 'Weight (kg)',
                      controller: _weightController,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 18),
          _FormCard(
            title: 'OWNER DETAILS',
            children: [
              _FormField(
                label: 'Primary Owner Name',
                controller: _ownerController,
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(context),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.heading,
                    minimumSize: const Size.fromHeight(48),
                    side: const BorderSide(color: Color(0xFFE0E3E5)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF068A98),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'Save Changes',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({required this.icon, required this.onPressed});

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
        icon: Icon(icon, color: AppTheme.heading),
      ),
    );
  }
}

class _FormCard extends StatelessWidget {
  const _FormCard({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE0E3E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.3,
              color: AppTheme.muted,
            ),
          ),
          const SizedBox(height: 14),
          ...children,
        ],
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  const _FormField({required this.label, required this.controller});

  final String label;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: AppTheme.muted,
          ),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFFF8F9FA),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE0E3E5)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE0E3E5)),
            ),
          ),
        ),
      ],
    );
  }
}
