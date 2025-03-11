const { PrismaClient } = require("@prisma/client");
const { fakerDE: faker } = require("@faker-js/faker");

const prisma = new PrismaClient();

function generateRandomColor() {
  let hexColor = "";
  do {
    const randomInt = Math.floor(Math.random() * 16777216);
    hexColor = `#${randomInt.toString(16).padStart(6, "0")}`;
  } while (
    hexColor.toLowerCase() === "#ffffff" ||
    hexColor.toLowerCase() === "#000000"
  ); // Ensure it’s not white or black
  return hexColor;
}

async function seed() {
  console.log("Seeding data...");

  // Create Organizations (1 Main Clinic and 2 Satellite Branches)
  const organizations = [];
  await prisma.organization.create({
    data: {
      id: "main-clinic",
      name: "Main Clinic",
      type: "Main Clinic",
    },
  });
  organizations.push({ id: "main-clinic" });

  for (let i = 1; i <= 2; i++) {
    const branch = await prisma.organization.create({
      data: {
        id: `branch-${i}`,
        name: `Satellite Branch ${i}`,
        type: "Satellite Branch",
        parent_id: "main-clinic",
      },
    });
    organizations.push(branch);
  }

  // Create 3 Staff (Assigned to Organizations)
  const staffRoles = ["NURSE", "CASHIER", "LAB_TECHNICIAN"];
  for (const role of staffRoles) {
    const org = organizations[Math.floor(Math.random() * organizations.length)];
    await prisma.staff.create({
      data: {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(), // Updated to `person` for faker v8+
        phone: faker.phone.number(),
        address: faker.location.streetAddress(), // Updated to `location`
        department: faker.company.name(),
        role: role,
        status: "ACTIVE",
        colorCode: generateRandomColor(),
        organization_id: org.id,
      },
    });
  }

  // Create 10 Doctors (Assigned to Organizations)
  const doctors = [];
  for (let i = 0; i < 10; i++) {
    const org = organizations[Math.floor(Math.random() * organizations.length)];
    const doctor = await prisma.doctor.create({
      data: {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        specialization: faker.person.jobType(), // Updated to `person`
        license_number: faker.string.uuid(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        department: faker.company.name(),
        availability_status: "ACTIVE",
        colorCode: generateRandomColor(),
        type: i % 2 === 0 ? "FULL" : "PART",
        organization_id: org.id,
        working_days: {
          create: [
            {
              day: "Monday",
              start_time: "08:00",
              close_time: "17:00",
            },
            {
              day: "Wednesday",
              start_time: "08:00",
              close_time: "17:00",
            },
          ],
        },
      },
    });
    doctors.push(doctor);
  }

  // Create 20 Patients (Some Assigned to Organizations)
  const patients = [];
  for (let i = 0; i < 20; i++) {
    const org = i % 2 === 0 ? organizations[Math.floor(Math.random() * organizations.length)] : null; // Half assigned to orgs
    const patient = await prisma.patient.create({
      data: {
        id: faker.string.uuid(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        date_of_birth: faker.date.birthdate(),
        gender: i % 2 === 0 ? "MALE" : "FEMALE",
        phone: faker.phone.number(),
        email: faker.internet.email(),
        marital_status: i % 3 === 0 ? "Married" : "Single",
        address: faker.location.streetAddress(),
        privacy_consent: true,
        service_consent: true,
        medical_consent: true,
        colorCode: generateRandomColor(),
        organization_id: org ? org.id : null, // Optional affiliation
        emergency_contacts: {
          create: [
            {
              name: faker.person.fullName(),
              phone: faker.phone.number(),
              relation: "Sibling",
            },
          ],
        },
        conditions: {
          create: [
            {
              name: faker.lorem.word(),
              onset_date: faker.date.past(),
              coding: {
                create: [
                  {
                    system: "http://snomed.info/sct",
                    code: faker.string.numeric(6),
                    display: faker.lorem.word(),
                  },
                ],
              },
            },
          ],
        },
        allergies: {
          create: [
            {
              substance: faker.lorem.word(),
              reaction: faker.lorem.sentence(),
              coding: {
                create: [
                  {
                    system: "http://snomed.info/sct",
                    code: faker.string.numeric(6),
                    display: faker.lorem.word(),
                  },
                ],
              },
            },
          ],
        },
        insurance: {
          create: [
            {
              provider: faker.company.name(),
              number: faker.string.uuid(),
            },
          ],
        },
      },
    });
    patients.push(patient);
  }

  // Create 20 Appointments (Assigned to Organizations)
  for (let i = 0; i < 20; i++) {
    const doctor = doctors[Math.floor(Math.random() * doctors.length)];
    const patient = patients[Math.floor(Math.random() * patients.length)];
    const org = organizations[Math.floor(Math.random() * organizations.length)];

    await prisma.appointment.create({
      data: {
        patient_id: patient.id,
        doctor_id: doctor.id,
        organization_id: org.id,
        appointment_date: faker.date.soon(),
        time: "10:00",
        status: i % 4 === 0 ? "PENDING" : "SCHEDULED",
        type: "Checkup",
        note: faker.lorem.sentence(),
      },
    });
  }

  // Create 10 Medical Records (Tied to Appointments)
  const appointments = await prisma.appointment.findMany();
  for (let i = 0; i < 10; i++) {
    const appointment = appointments[Math.floor(Math.random() * appointments.length)];
    await prisma.medicalRecord.create({
      data: {
        patient_id: appointment.patient_id,
        appointment_id: appointment.id,
        doctor_id: appointment.doctor_id,
        organization_id: appointment.organization_id,
        status: "Completed",
        treatment_plan: faker.lorem.paragraph(),
        notes: faker.lorem.sentence(),
      },
    });
  }

  console.log("Seeding complete!");
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});