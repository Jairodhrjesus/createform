import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  // 1. La Encuesta (Contenedor Principal)
  Survey: a.model({
    title: a.string().required(),
    description: a.string(),
    isActive: a.boolean().default(true),
    
    // Relaciones
    questions: a.hasMany('Question', 'surveyId'),
    outcomes: a.hasMany('Outcome', 'surveyId'),
    submissions: a.hasMany('Submission', 'surveyId'),
  })
  .authorization(allow => [allow.owner()]), // Solo el dueño puede ver/editar su encuesta

  // 2. Resultados Posibles (Lógica de Rangos)
  Outcome: a.model({
    surveyId: a.id().required(),
    survey: a.belongsTo('Survey', 'surveyId'),
    
    title: a.string().required(), 
    description: a.string(),
    minScore: a.integer().required(), 
    maxScore: a.integer().required(), 
    redirectUrl: a.string(),
  })
  .authorization(allow => [
    allow.owner(), 
    allow.publicApiKey() // El frontend público necesita leer esto para mostrar resultados
  ]),

  // 3. Preguntas
  Question: a.model({
    surveyId: a.id().required(),
    survey: a.belongsTo('Survey', 'surveyId'),
    
    text: a.string().required(),
    order: a.integer(),
    type: a.string().default('single_choice'), // Por si luego añades más tipos
    
    options: a.hasMany('Option', 'questionId'),
  })
  .authorization(allow => [
    allow.owner(), 
    allow.publicApiKey() // El público debe poder leer las preguntas
  ]),

  // 4. Opciones (Donde vive el puntaje)
  Option: a.model({
    questionId: a.id().required(),
    question: a.belongsTo('Question', 'questionId'),
    
    text: a.string().required(),
    score: a.integer().default(0), 
  })
  .authorization(allow => [
    allow.owner(), 
    allow.publicApiKey() // El público debe leer las opciones para elegirlas
  ]),

  // 5. Envíos de usuarios (Respuestas)
  Submission: a.model({
    surveyId: a.id().required(),
    survey: a.belongsTo('Survey', 'surveyId'),
    
    totalScore: a.integer().required(),
    outcomeTitle: a.string(), 
    answersContent: a.json(), // Guardamos el detalle como JSON
    respondentId: a.string(), // Opcional: para rastrear cookies/sesiones anónimas
  })
  .authorization(allow => [
    allow.owner(), // Tú ves todas las respuestas
    allow.publicApiKey() // Cualquiera puede CREAR una respuesta
  ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // IMPORTANTE: Cambiamos a 'userPool' como defecto para que funcione el Login de dueños
    defaultAuthorizationMode: 'userPool', 
    // Habilitamos API Key para que los usuarios anónimos puedan responder encuestas
    apiKeyAuthorizationMode: {
      expiresInDays: 30, // La API key rotará automáticamente
    },
  },
});