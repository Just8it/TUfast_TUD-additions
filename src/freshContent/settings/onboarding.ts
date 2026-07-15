import { t } from '../../i18n'

type OnboardingStep = {
  title: string
  icon: string
  h1: string
  btnText: string
  skipText: string
}

const onboardingStepDefinitions = [
  {
    title: 'Welcome',
    icon: '',
    h1: 'onboarding.steps.welcome',
    btnText: 'onboarding.start',
    skipText: 'onboarding.skip'
  },
  {
    title: 'FacultySetup',
    icon: 'IconSchool',
    h1: 'onboarding.steps.faculty',
    btnText: 'onboarding.next',
    skipText: 'onboarding.skip'
  },
  {
    title: 'LoginSetup',
    icon: 'IconLock',
    h1: 'onboarding.steps.login',
    btnText: 'onboarding.next',
    skipText: 'onboarding.skip'
  },
  {
    title: 'OtpSetup',
    icon: 'IconLock',
    h1: 'onboarding.steps.otp',
    btnText: 'onboarding.next',
    skipText: 'onboarding.skip'
  },
  {
    title: 'EMailSetup',
    icon: 'IconNotification',
    h1: 'onboarding.steps.email',
    btnText: 'onboarding.next',
    skipText: 'onboarding.skip'
  },
  {
    title: 'OpalSelmaSetup',
    icon: 'IconAdjustments',
    h1: 'onboarding.steps.opalSelma',
    btnText: 'onboarding.next',
    skipText: 'onboarding.skip'
  },
  {
    title: 'SearchengineSetup',
    icon: 'IconSearch',
    h1: 'onboarding.steps.searchEngines',
    btnText: 'onboarding.next',
    skipText: 'onboarding.skip'
  },
  {
    title: 'DoneSetup',
    icon: 'IconRocket',
    h1: 'onboarding.steps.done',
    btnText: 'onboarding.finish',
    skipText: ''
  }
] as const

export const onboardingStepCount = onboardingStepDefinitions.length

export const getOnboardingSteps = () =>
  onboardingStepDefinitions.map((step) => ({
    title: step.title,
    icon: step.icon,
    h1: t(step.h1),
    btnText: t(step.btnText),
    skipText: step.skipText ? t(step.skipText) : ''
  })) satisfies readonly OnboardingStep[]
