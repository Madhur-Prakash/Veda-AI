import bcrypt from 'bcryptjs';
import { connectMongo } from '@/services/mongo.js';
import { UserModel } from '@/models/user.model.js';
import { AssignmentModel } from '@/models/assignment.model.js';

const SEED_USERS = [
  { externalId: 'usr_seed_001', name: 'Sarah Johnson', email: 'sarah@vedaai.dev', password: 'password123', school: 'Delhi Public School' },
  { externalId: 'usr_seed_002', name: 'Raj Sharma', email: 'raj@vedaai.dev', password: 'password123', school: 'Kendriya Vidyalaya' }
];

async function seed() {
  await connectMongo();

  console.log('Clearing existing seed data...');
  await UserModel.deleteMany({ externalId: { $in: SEED_USERS.map((u) => u.externalId) } });
  await AssignmentModel.deleteMany({ teacherId: { $in: SEED_USERS.map((u) => u.externalId) } });

  console.log('Creating seed users...');
  const [sarah, raj] = await Promise.all(
    SEED_USERS.map(async (u) => {
      const passwordHash = await bcrypt.hash(u.password, 12);
      return UserModel.create({ externalId: u.externalId, name: u.name, email: u.email, passwordHash, school: u.school });
    })
  );

  console.log('Creating seed assignments...');
  await AssignmentModel.insertMany([
    {
      externalId: 'asmt_seed_001',
      teacherId: sarah!.externalId,
      title: 'Quiz on Electricity',
      subject: 'Science',
      className: '8',
      topic: 'Electric Current and Chemical Effects',
      dueDate: new Date(Date.now() + 7 * 86400000),
      durationMinutes: 45,
      totalMarks: 20,
      inputSource: 'paste',
      content: 'Electric current flows through conductors. Electrolysis is a process driven by electric current.',
      instructions: 'Attempt all questions',
      language: 'English',
      strictMode: false,
      questionControls: [
        { type: 'MCQ', count: 5, marks: 2, difficultyDistribution: { easy: 2, medium: 2, hard: 1 } },
        { type: 'Short', count: 5, marks: 2, difficultyDistribution: { easy: 2, medium: 2, hard: 1 } }
      ],
      status: 'COMPLETED',
      generatedAssessment: {
        sections: [
          {
            title: 'Section A – Multiple Choice Questions',
            instruction: 'Choose the correct answer for each question. Each question carries 2 marks.',
            questions: [
              { id: 'q1', question: 'Which of the following is a good conductor of electricity?', type: 'MCQ', marks: 2, difficulty: 'Easy', answer_key: 'Copper — it is a metal and metals have free electrons that can carry electric current.', blooms_level: 'Remember', estimated_time: '1 min' },
              { id: 'q2', question: 'What is the SI unit of electric current?', type: 'MCQ', marks: 2, difficulty: 'Easy', answer_key: 'Ampere (A) — defined as the flow of one coulomb of charge per second.', blooms_level: 'Remember', estimated_time: '1 min' },
              { id: 'q3', question: 'During electrolysis of water, which gas is produced at the cathode?', type: 'MCQ', marks: 2, difficulty: 'Medium', answer_key: 'Hydrogen — positive hydrogen ions (H⁺) move to the cathode (negative electrode) and are reduced.', blooms_level: 'Understand', estimated_time: '1 min' },
              { id: 'q4', question: 'Which liquid allows electric current to pass through it?', type: 'MCQ', marks: 2, difficulty: 'Medium', answer_key: 'Salt solution — it contains sodium (Na⁺) and chloride (Cl⁻) ions which carry electric charge.', blooms_level: 'Understand', estimated_time: '1 min' },
              { id: 'q5', question: 'The process of depositing a layer of metal on an object using electricity is called:', type: 'MCQ', marks: 2, difficulty: 'Hard', answer_key: 'Electroplating — the object is made the cathode; the coating metal is the anode; metal ions deposit on the object.', blooms_level: 'Apply', estimated_time: '1 min' }
            ]
          },
          {
            title: 'Section B – Short Answer Questions',
            instruction: 'Answer each question in 2–3 sentences. Each question carries 2 marks.',
            questions: [
              { id: 'q6', question: 'Define electric current and state its SI unit.', type: 'Short', marks: 2, difficulty: 'Easy', answer_key: 'Electric current is the rate of flow of electric charge through a conductor. Its SI unit is the Ampere (A), where 1 A = 1 coulomb per second.', blooms_level: 'Remember', estimated_time: '3 min' },
              { id: 'q7', question: 'What is electrolysis? Give one example.', type: 'Short', marks: 2, difficulty: 'Easy', answer_key: 'Electrolysis is the decomposition of a chemical compound using electricity passed through its solution or melt. Example: electrolysis of water produces hydrogen at the cathode and oxygen at the anode.', blooms_level: 'Understand', estimated_time: '3 min' },
              { id: 'q8', question: 'Why is pure water a poor conductor of electricity?', type: 'Short', marks: 2, difficulty: 'Medium', answer_key: 'Pure water contains very few ions, so it cannot carry electric current effectively. When salts dissolve in water they dissociate into ions which conduct electricity, making the solution a good conductor.', blooms_level: 'Understand', estimated_time: '3 min' },
              { id: 'q9', question: 'Name the electrodes used in electrolysis and state their polarity.', type: 'Short', marks: 2, difficulty: 'Medium', answer_key: 'Cathode is the negative electrode — positive ions (cations) are attracted to it. Anode is the positive electrode — negative ions (anions) are attracted to it.', blooms_level: 'Remember', estimated_time: '3 min' },
              { id: 'q10', question: 'List two applications of electroplating in everyday life.', type: 'Short', marks: 2, difficulty: 'Hard', answer_key: '(1) Gold/silver electroplating of jewellery to make it attractive and resistant to tarnish. (2) Galvanisation — coating iron with zinc to prevent rusting (corrosion protection).', blooms_level: 'Apply', estimated_time: '4 min' }
            ]
          }
        ]
      }
    },
    {
      externalId: 'asmt_seed_002',
      teacherId: sarah!.externalId,
      title: 'Chapter Test – Photosynthesis',
      subject: 'Biology',
      className: '9',
      topic: 'Photosynthesis and Respiration',
      dueDate: new Date(Date.now() + 3 * 86400000),
      durationMinutes: 60,
      totalMarks: 30,
      inputSource: 'paste',
      content: 'Photosynthesis converts CO2 and water into glucose using sunlight.',
      instructions: 'All questions are compulsory',
      language: 'English',
      strictMode: true,
      questionControls: [
        { type: 'MCQ', count: 5, marks: 1, difficultyDistribution: { easy: 3, medium: 2, hard: 0 } },
        { type: 'Short', count: 5, marks: 3, difficultyDistribution: { easy: 1, medium: 3, hard: 1 } },
        { type: 'Long', count: 2, marks: 5, difficultyDistribution: { easy: 0, medium: 1, hard: 1 } }
      ],
      status: 'PROCESSING'
    },
    {
      externalId: 'asmt_seed_003',
      teacherId: raj!.externalId,
      title: 'Algebra Mid-Term',
      subject: 'Mathematics',
      className: '10',
      topic: 'Linear Equations in Two Variables',
      dueDate: new Date(Date.now() + 14 * 86400000),
      durationMinutes: 90,
      totalMarks: 40,
      inputSource: 'paste',
      content: 'Linear equations have the form ax + by = c.',
      instructions: 'Show all working',
      language: 'English',
      strictMode: false,
      questionControls: [
        { type: 'Short', count: 8, marks: 3, difficultyDistribution: { easy: 3, medium: 3, hard: 2 } },
        { type: 'Long', count: 4, marks: 4, difficultyDistribution: { easy: 1, medium: 2, hard: 1 } }
      ],
      status: 'QUEUED'
    }
  ]);

  console.log('\nSeed complete!');
  console.log('\nSeed accounts:');
  for (const u of SEED_USERS) console.log(`  ${u.name} — ${u.email} / ${u.password}`);
  process.exit(0);
}

void seed();
