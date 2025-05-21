import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs"
import Calculator from './components/Calculator'
import { Shader } from './components/Shader'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8 px-4">
        <h1 className="text-4xl font-bold mb-8 text-center">InVideo Assignment</h1>
        
        <div>
          <Tabs defaultValue="calculator" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
              <TabsTrigger value="shader">Shader</TabsTrigger>
            </TabsList>
            <TabsContent value="calculator" className="mt-6">
              <Calculator />
            </TabsContent>
            <TabsContent value="shader" className="mt-6">
              <Shader />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

export default App
