import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { calculateSolarModel, defaultInputs, SolarInputs, SolarResults } from "@/lib/calculator";
import { getSourceDetails } from '@/lib/sources';
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumberWithCommas } from "@/lib/formatters";
import { AlertCircle, Info, BatteryCharging, Coins, Download, Factory, Trash2, Zap, Leaf, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MetricCard } from "../components/MetricCard";
import { GridConnectionCostBreakdown } from "../components/GridConnectionCostBreakdown";
import { GridConnectionSliders, type GridConnectionCosts } from "../components/GridConnectionSliders";
import { SensitivityHeatmap } from "../components/SensitivityHeatmap";
import { CashFlowTable } from "../components/CashFlowTable";
import { StakeholderValueChart } from "../components/StakeholderValueChart";
import { calculateSensitivityMatrix } from "@/lib/sensitivity";
import { generatePDFReport } from "@/lib/pdfReport";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [inputs, setInputs] = useState<SolarInputs>(defaultInputs);
  const [results, setResults] = useState<SolarResults>(calculateSolarModel(defaultInputs));
  const [sensitivityMatrix, setSensitivityMatrix] = useState(calculateSensitivityMatrix(defaultInputs));
  const [modelName, setModelName] = useState("My Solar Model");
  const [modelDescription, setModelDescription] = useState("");
  const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);
  const [showSourceInfo, setShowSourceInfo] = useState<string | null>(null);
  const [gridConnectionCosts, setGridConnectionCosts] = useState<GridConnectionCosts | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("solarModel");
    if (saved) {
      try {
        const { inputs: savedInputs, name, description } = JSON.parse(saved);
        setInputs(savedInputs);
        setModelName(name);
        setModelDescription(description);
      } catch (e) {
        console.error("Failed to load saved model:", e);
      }
    }
    setShowDisclaimerModal(true);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem("solarModel", JSON.stringify({
      inputs,
      name: modelName,
      description: modelDescription,
      timestamp: new Date().toISOString(),
    }));
  }, [inputs, modelName, modelDescription]);

  // Recalculate when inputs change
  useEffect(() => {
    const newResults = calculateSolarModel(inputs);
    setResults(newResults);
    setSensitivityMatrix(calculateSensitivityMatrix(inputs));
  }, [inputs]);

  const handleInputChange = (key: keyof SolarInputs, value: any) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleExportPDF = () => {
    try {
      generatePDFReport(inputs, results);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportCSV = () => {
    const csv = [
      ["Private Wire Solar Farm Calculator - Export"],
      ["Model Name", modelName],
      ["Description", modelDescription],
      ["Export Date", new Date().toISOString()],
      [],
      ["INPUTS"],
      ...Object.entries(inputs).map(([key, value]) => [key, value]),
      [],
      ["RESULTS"],
      ["Total CAPEX", formatCurrency(results.summary.totalCapex)],
      ["LCOE", `£${results.summary.lcoe.toFixed(2)}/MWh`],
      ["IRR", `${(results.summary.irr * 100).toFixed(2)}%`],
      ["Payback Period", `${results.summary.paybackPeriod.toFixed(2)} years`],
      ["Total NPV", formatCurrency(results.summary.totalNpv)],
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${modelName}-export.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const handleReset = () => {
    setInputs(defaultInputs);
    setModelName("My Solar Model");
    setModelDescription("");
    localStorage.removeItem("solarModel");
    toast.success("Model reset to defaults");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimerModal} onOpenChange={setShowDisclaimerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Important Disclaimer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Indicative projections based on Jan 2026 data.</strong> Not for investment decisions without professional verification.{" "}
                <a href="#" className="underline font-semibold">
                  View full details
                </a>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              This calculator provides estimates based on the inputs you provide. Results are indicative only and should not be relied upon for investment decisions.
              Please consult with qualified professionals before making any investment decisions.
            </p>
            <Button onClick={() => setShowDisclaimerModal(false)} className="w-full">
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">Private Wire Solar Calculator</h1>
              <p className="text-slate-300">Advanced financial modeling for solar assets with private wire integration</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" className="text-white border-white hover:bg-white/10">
                📊 Export CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="text-white border-white hover:bg-white/10">
                📄 Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <MetricCard
            label="Total CAPEX"
            value={formatCurrency(results.summary.totalCapex)}
            icon={<Factory className="w-5 h-5" />}
          />
          <MetricCard
            label="LCOE (Real)"
            value={`£${results.summary.lcoe.toFixed(2)}/MWh`}
            icon={<Zap className="w-5 h-5" />}
          />
          <MetricCard
            label="IRR (Unlevered)"
            value={`${(results.summary.irr * 100).toFixed(2)}%`}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <MetricCard
            label="Payback Period"
            value={results.summary.paybackPeriod > 25 ? "> Project Life" : `${results.summary.paybackPeriod.toFixed(2)} yrs`}
            icon={<BatteryCharging className="w-5 h-5" />}
          />
          <MetricCard
            label="Total NPV"
            value={formatCurrency(results.summary.totalNpv)}
            icon={<Coins className="w-5 h-5" />}
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="landowner">Landowner</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Parameters Panel */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Parameters</CardTitle>
                  <CardDescription>Adjust project inputs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* System Size */}
                  <div>
                    <Label>System Size (MW)</Label>
                    <Input
                      type="number"
                      value={inputs.systemSizeMW}
                      onChange={(e) => handleInputChange("systemSizeMW", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* Annual Generation */}
                  <div>
                    <Label>Annual Generation (MWh)</Label>
                    <Input
                      type="number"
                      value={inputs.annualGenerationMWh}
                      onChange={(e) => handleInputChange("annualGenerationMWh", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* CAPEX */}
                  <div>
                    <Label>CAPEX per MW (£)</Label>
                    <Input
                      type="number"
                      value={inputs.capexPerMW}
                      onChange={(e) => handleInputChange("capexPerMW", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* Cable Distance */}
                  <div>
                    <Label>Cable Distance (km)</Label>
                    <Input
                      type="number"
                      value={inputs.cableDistanceKm}
                      onChange={(e) => handleInputChange("cableDistanceKm", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* Cable Voltage */}
                  <div>
                    <Label>Cable Voltage (kV)</Label>
                    <select
                      value={inputs.cableVoltageKV}
                      onChange={(e) => handleInputChange("cableVoltageKV", parseInt(e.target.value))}
                      className="w-full mt-2 px-3 py-2 border rounded-md"
                    >
                      <option value={6}>6kV</option>
                      <option value={11}>11kV</option>
                      <option value={33}>33kV</option>
                    </select>
                  </div>

                  {/* Land Rental Cost */}
                  <div>
                    <Label>Land Rental Cost per MW/year (£)</Label>
                    <Input
                      type="number"
                      value={inputs.landRentalCostPerMWYear}
                      onChange={(e) => handleInputChange("landRentalCostPerMWYear", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* Land Value */}
                  <div>
                    <Label>Land Value (£)</Label>
                    <Input
                      type="number"
                      value={inputs.landValue}
                      onChange={(e) => handleInputChange("landValue", parseFloat(e.target.value))}
                      className="mt-2"
                    />
                  </div>

                  {/* Reset Button */}
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </CardContent>
              </Card>

              {/* Results Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Stakeholder Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stakeholder Value Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StakeholderValueChart results={results} />
                  </CardContent>
                </Card>

                {/* Cash Flow */}
                <Card>
                  <CardHeader>
                    <CardTitle>Annual Cash Flow</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={results.yearlyData.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue" />
                        <Line type="monotone" dataKey="opex" stroke="#ef4444" name="OPEX" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Analysis</CardTitle>
                <CardDescription>IRR sensitivity to cable voltage and distance</CardDescription>
              </CardHeader>
              <CardContent>
                <SensitivityHeatmap matrix={sensitivityMatrix} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Annual Cash Flow Details</CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowTable data={results.yearlyData} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Landowner Tab */}
          <TabsContent value="landowner">
            <LandownerPage inputs={inputs} results={results} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model Name</Label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <textarea
                    value={modelDescription}
                    onChange={(e) => setModelDescription(e.target.value)}
                    className="w-full mt-2 p-2 border rounded-md"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Storage</CardTitle>
                <CardDescription>Your model is saved locally in your browser</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Models are automatically saved to your browser's local storage. No data is sent to any server.
                </p>
                <Button onClick={handleReset} variant="destructive">
                  Clear All Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
