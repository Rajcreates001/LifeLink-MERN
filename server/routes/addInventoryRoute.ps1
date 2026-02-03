$path = "e:\Black folder\Projects\Major Project\LifeLink-MERN-v2\server\routes\hospitalRoutes.js"
$content = Get-Content $path -Raw

$newRoute = @"

// 8. Inventory Prediction
router.post('/inventory', async (req, res) => {
    try {
        const result = await runPythonModel('predict_inventory', req.body, ML_SCRIPT);
        res.json(result);
    } catch (error) { res.status(500).json({ error: error.message }); }
});
"@

$content = $content -replace '(// 7\. Hospital Performance[\s\S]*?^}\);)([\s]*)(module\.exports)', "`$1$newRoute`n`n`$2`$3"
Set-Content $path $content
Write-Host "Inventory endpoint added to hospitalRoutes.js"
