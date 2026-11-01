class Pet {
  const Pet({
    this.petId,
    required this.name,
    required this.breed,
    required this.gender,
    required this.age,
    required this.weight,
    this.nextAppointment,
  });

  final int? petId;

  final String name;
  final String breed;
  final String gender;
  final String age;
  final String weight;
  final String? nextAppointment;
}

const samplePets = <Pet>[
  Pet(
    name: 'Luna',
    breed: 'Golden Retriever',
    gender: 'Female',
    age: '2 yrs, 4 mos',
    weight: '27.5',
    nextAppointment: 'Checkup - Wed, Nov 4 - 10:00 AM',
  ),
  Pet(
    name: 'Mochi',
    breed: 'Shih Tzu',
    gender: 'Male',
    age: '1 yr, 8 mos',
    weight: '6.2',
  ),
];
