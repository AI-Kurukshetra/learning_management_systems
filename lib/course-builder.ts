import type { CourseModuleItem, CourseModuleType, CurriculumTag } from "@/lib/types";

export const COURSE_MODULE_TYPES: Array<{ value: CourseModuleType; label: string }> = [
  { value: "lesson", label: "Lesson" },
  { value: "video", label: "Video" },
  { value: "quiz", label: "Quiz" },
  { value: "resource", label: "Resource" },
];

export const CURRICULUM_TAGS: CurriculumTag[] = [
  "Math",
  "Science",
  "History",
  "Programming",
  "Language",
];

export type CourseTemplateKey = "math" | "science" | "custom";

export interface CourseModuleDraft {
  title: string;
  description: string;
  content: string;
  curriculumTag: CurriculumTag | null;
  moduleType: CourseModuleType;
  position: number;
}

export interface CourseBuilderActionState {
  success: boolean;
  error: string | null;
  message: string | null;
}

export const initialCourseBuilderActionState: CourseBuilderActionState = {
  success: false,
  error: null,
  message: null,
};

export const COURSE_TEMPLATES: Array<{
  key: CourseTemplateKey;
  label: string;
  description: string;
}> = [
  {
    key: "math",
    label: "Math Course Template",
    description: "Preload a structured math flow with lessons, practice, quiz, and resource wrap-up.",
  },
  {
    key: "science",
    label: "Science Course Template",
    description: "Start with concept lessons, a demonstration block, quiz, and closing resource guidance.",
  },
  {
    key: "custom",
    label: "Custom Template",
    description: "Generate a neutral starter structure that can be adapted to any subject.",
  },
];

const TEMPLATE_BLUEPRINTS: Record<CourseTemplateKey, Omit<CourseModuleDraft, "position">[]> = {
  math: [
    {
      title: "Introduction",
      description: "Outline the course goals, pacing, and success metrics.",
      content: "Add the course overview, learner outcomes, and any prerequisite review here.",
      curriculumTag: "Math",
      moduleType: "lesson",
    },
    {
      title: "Lesson 1",
      description: "Introduce the first core concept with worked examples.",
      content: "Explain the main theorem, formula, or process students should learn first.",
      curriculumTag: "Math",
      moduleType: "lesson",
    },
    {
      title: "Lesson 2",
      description: "Build on the first lesson with guided problem solving.",
      content: "Add practice prompts, step-by-step reasoning, and model solutions.",
      curriculumTag: "Math",
      moduleType: "lesson",
    },
    {
      title: "Worked Example Video",
      description: "Demonstrate the concept through a guided walkthrough.",
      content: "Add a video link or teacher-led demonstration notes.",
      curriculumTag: "Math",
      moduleType: "video",
    },
    {
      title: "Quiz",
      description: "Check understanding of the covered math concepts.",
      content: "Add the objective, time limit, and scoring guidance for the quiz.",
      curriculumTag: "Math",
      moduleType: "quiz",
    },
    {
      title: "Final Resource",
      description: "Wrap the unit with revision resources and next-step guidance.",
      content: "Add formula sheets, revision links, and preparation notes for the next module.",
      curriculumTag: "Math",
      moduleType: "resource",
    },
  ],
  science: [
    {
      title: "Introduction",
      description: "Frame the scientific theme, vocabulary, and inquiry goals.",
      content: "Document the unit overview, hypothesis expectations, and safety guidance if needed.",
      curriculumTag: "Science",
      moduleType: "lesson",
    },
    {
      title: "Lesson 1",
      description: "Present the first scientific principle with examples or demonstrations.",
      content: "Add diagrams, explanations, or experiment context for the opening lesson.",
      curriculumTag: "Science",
      moduleType: "lesson",
    },
    {
      title: "Lesson 2",
      description: "Expand the concept through analysis or a follow-up demonstration.",
      content: "Capture the supporting theory, discussion prompts, and observation tasks.",
      curriculumTag: "Science",
      moduleType: "lesson",
    },
    {
      title: "Lab Demonstration",
      description: "Show the concept in action.",
      content: "Add experiment footage, observation instructions, or demonstration notes.",
      curriculumTag: "Science",
      moduleType: "video",
    },
    {
      title: "Quiz",
      description: "Short knowledge check for key terms and concepts.",
      content: "List the quiz scope, format, and scoring approach.",
      curriculumTag: "Science",
      moduleType: "quiz",
    },
    {
      title: "Final Resource",
      description: "Culminating references and revision guidance for the science unit.",
      content: "Add study resources, field notes, and extension reading.",
      curriculumTag: "Science",
      moduleType: "resource",
    },
  ],
  custom: [
    {
      title: "Introduction",
      description: "Set expectations and define the learner journey.",
      content: "Add the overview, goals, and welcome content for this course.",
      curriculumTag: null,
      moduleType: "lesson",
    },
    {
      title: "Lesson 1",
      description: "First instructional block.",
      content: "Add the first lesson content here.",
      curriculumTag: null,
      moduleType: "lesson",
    },
    {
      title: "Lesson 2",
      description: "Second instructional block.",
      content: "Add the second lesson content here.",
      curriculumTag: null,
      moduleType: "lesson",
    },
    {
      title: "Guided Video",
      description: "Optional explanation or walkthrough.",
      content: "Add a video link or structured walkthrough notes.",
      curriculumTag: null,
      moduleType: "video",
    },
    {
      title: "Quiz",
      description: "Quick check for understanding.",
      content: "Add quiz scope, format, and instructions.",
      curriculumTag: null,
      moduleType: "quiz",
    },
    {
      title: "Final Resource",
      description: "Capstone materials or references.",
      content: "Describe the closing resource pack, reading list, or next steps.",
      curriculumTag: null,
      moduleType: "resource",
    },
  ],
};

export function buildTemplateModules(template: CourseTemplateKey): CourseModuleDraft[] {
  return TEMPLATE_BLUEPRINTS[template].map((module, index) => ({
    ...module,
    position: index,
  }));
}

export function getCourseModuleTypeLabel(type: CourseModuleType) {
  return COURSE_MODULE_TYPES.find((option) => option.value === type)?.label ?? type;
}

export function serializeModuleOrder(modules: Pick<CourseModuleItem, "id" | "position">[]) {
  return modules
    .sort((left, right) => left.position - right.position)
    .map((module) => module.id);
}
