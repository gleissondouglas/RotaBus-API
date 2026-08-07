import re

with open("frontend/app/navegando.tsx", "r") as f:
    content = f.read()

# Task 1: NavigationStage
content = re.sub(
    r'type NavigationStage =.*?\| "arrived";',
    'type NavigationStage =\n  | "walking"\n  | "waiting_bus"\n  | "on_bus"\n  | "arrived";',
    content,
    flags=re.DOTALL
)

# Task 2 & 3: globalStepIndex and stages
content = content.replace('walking_to_stop', 'walking')
content = content.replace('walking_to_destination', 'walking')
content = content.replace('boarded_success', 'on_bus')

# Replace currentStepIndex with globalStepIndex
content = content.replace('currentStepIndex', 'globalStepIndex')
content = content.replace('setCurrentStepIndex', 'setGlobalStepIndex')
content = content.replace('const [globalStepIndex, setGlobalStepIndex] = useState(0); // Qual "passo" da caminhada o usuário está executando', 'const [globalStepIndex, setGlobalStepIndex] = useState(0);')

# Fix isWalkingOnly stage initial state since "walking" is now both:
content = content.replace('isWalkingOnly ? "walking" : "walking"', '"walking"')

# Task 4: Dynamic transit details from allSteps[globalStepIndex]
# We need to replace the static declarations:
# const busLine = String(params.busLine || "--");
# const direction = String(params.direction || "--");
# const stopName = String(params.stopName || "ponto indicado");

static_decls = """  const busLine = String(params.busLine || "--");
  const direction = String(params.direction || "--");
  const stopName = String(params.stopName || "ponto indicado");"""

dynamic_decls = """  const activeTransitStep = allSteps[globalStepIndex]?.type === "transit" 
    ? allSteps[globalStepIndex] 
    : allSteps.slice(globalStepIndex).find(s => s.type === "transit");

  const busLine = String(activeTransitStep?.lineName || activeTransitStep?.line || params.busLine || "--");
  const direction = String(activeTransitStep?.headsign || params.direction || "--");
  const stopName = String(activeTransitStep?.from || activeTransitStep?.departureStop?.name || params.stopName || "ponto indicado");"""

content = content.replace(static_decls, dynamic_decls)

# We also need to fix `walkSteps` to be `allSteps` in the UI and logic?
# If `globalStepIndex` tracks `allSteps`, then in the useEffect for tracking distance, we shouldn't use `walkSteps` but `allSteps`.
# Wait! Let's check how walkSteps is used.
# const currentStep = walkSteps[globalStepIndex]; -> wait, if I just replaced currentStepIndex with globalStepIndex, now it's walkSteps[globalStepIndex].
# But `walkSteps` only has the FIRST walk segment!
# If globalStepIndex tracks `allSteps`, then `walkSteps[globalStepIndex]` will be WRONG if there was a transit step before it.
# So I should change `walkSteps` references to `allSteps`.
content = content.replace('walkSteps[globalStepIndex]', 'allSteps[globalStepIndex]')
content = content.replace('walkSteps[globalStepIndex + 1]', 'allSteps[globalStepIndex + 1]')
content = content.replace('walkSteps.length', 'allSteps.length')
content = content.replace('walkSteps.some', 'allSteps.some')

with open("frontend/app/navegando.tsx", "w") as f:
    f.write(content)
