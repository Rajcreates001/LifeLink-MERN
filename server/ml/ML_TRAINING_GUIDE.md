# ML Model Training Commands Guide

## Overview
This document contains all the commands needed to train all machine learning models in the LifeLink project.

---

## Prerequisites
Before training any models, ensure you have the required dependencies installed:

```bash
pip install pandas scikit-learn prophet joblib networkx numpy
```

---

## Training All Models (One Command)

To train **all models at once**, use:

```bash
cd server/ml
python -c "
import ai_ml as ml

# Train all models
ml.train_and_save_model()
ml.train_compatibility_model()
ml.train_recommendation_model()
ml.train_health_risk_model()
ml.train_activity_cluster_model()
ml.train_behavior_forecast_model()
ml.train_emergency_hotspot_model()
ml.train_outbreak_forecast_model()
ml.train_severity_model()
ml.train_availability_model()
ml.train_allocation_model()
ml.train_policy_segmentation_model()
ml.train_healthcare_performance_model()
ml.train_anomaly_detection_model()
ml.train_hospital_severity_model()
ml.train_eta_model()
ml.train_bed_forecast_model()
ml.train_staff_allocation_model()
ml.train_hospital_performance_model()
ml.train_recovery_model()
ml.train_stay_duration_model()
ml.train_hospital_disease_forecast_model()
ml.train_inventory_model()

print('All models trained successfully!')
"
```

---

## Individual Model Training Commands

### 1. **Emergency Classifier**
Trains a classifier to categorize 911 emergency calls
- **CSV**: `911_calls.csv`
- **Output**: `emergency_classifier.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_and_save_model()"
```

### 2. **Compatibility Model**
Predicts organ/blood donor compatibility for transplants
- **CSV**: `compatibility_data.csv`
- **Output**: `compatibility_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_compatibility_model()"
```

### 3. **Hospital Recommendation Model**
Recommends best hospital based on emergency type, distance, traffic, and rating
- **CSV**: `hospital_data.csv`
- **Output**: `hospital_recommendation_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_recommendation_model()"
```

### 4. **Health Risk Model**
Predicts health risks based on patient demographics and health indicators
- **CSV**: `health_risk_data.csv`
- **Output**: `health_risk_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_health_risk_model()"
```

### 5. **Activity Cluster Model**
Clusters user activity patterns (SOS usage, donations, health logs)
- **CSV**: `user_activity_data.csv`
- **Output**: `activity_cluster_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_activity_cluster_model()"
```

### 6. **Behavior Forecast Model**
Forecasts user behavior patterns
- **CSV**: `user_forecast_data.csv`
- **Output**: `behavior_forecast_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_behavior_forecast_model()"
```

### 7. **Emergency Hotspot Model**
Identifies and forecasts emergency hotspots by location
- **CSV**: `emergency_hotspot_data.csv`
- **Output**: `emergency_hotspot_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_emergency_hotspot_model()"
```

### 8. **Outbreak Forecast Model**
Forecasts disease outbreaks using Prophet time-series model
- **CSV**: `outbreak_data.csv`
- **Output**: `outbreak_forecast_models.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_outbreak_forecast_model()"
```

### 9. **Emergency Severity Model**
Predicts severity level of emergencies
- **CSV**: `emergency_severity_data.csv`
- **Output**: `emergency_severity_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_severity_model()"
```

### 10. **Donor Availability Model**
Predicts donor resource availability by region and month
- **CSV**: `donor_availability_data.csv`
- **Output**: `donor_availability_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_availability_model()"
```

### 11. **Resource Allocation Model (Q-Learning)**
Trains a Q-learning model for optimal resource allocation
- **Uses**: No CSV file (synthetic data generated)
- **Output**: `allocation_q_table.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_allocation_model()"
```

### 12. **Policy Segmentation Model**
Segments policies based on health criteria
- **CSV**: `policy_data.csv`
- **Output**: `policy_segmentation_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_policy_segmentation_model()"
```

### 13. **Healthcare Performance Model**
Evaluates healthcare system performance metrics
- **CSV**: `policy_data.csv`
- **Output**: `healthcare_performance_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_healthcare_performance_model()"
```

### 14. **Anomaly Detection Model**
Detects anomalies in emergency and hospital admission data using Isolation Forest
- **CSV**: `anomaly_data.csv`
- **Output**: `anomaly_detection_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_anomaly_detection_model()"
```

### 15. **Hospital Severity Model**
Predicts severity based on hospital resource constraints
- **CSV**: `hospital_severity_data.csv`
- **Output**: `hospital_severity_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_hospital_severity_model()"
```

### 16. **ETA Model**
Predicts estimated time of arrival (ETA) for emergency response
- **CSV**: `eta_data.csv`
- **Output**: `eta_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_eta_model()"
```

### 17. **Bed Forecast Model**
Forecasts hospital bed availability
- **CSV**: `hospital_resource_data.csv`
- **Output**: `bed_forecast_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_bed_forecast_model()"
```

### 18. **Staff Allocation Model**
Optimizes staff allocation across departments
- **CSV**: `staff_allocation_data.csv`
- **Output**: `staff_allocation_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_staff_allocation_model()"
```

### 19. **Hospital Performance Model**
Evaluates overall hospital performance metrics
- **CSV**: `hospital_performance_data.csv`
- **Output**: `hospital_performance_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_hospital_performance_model()"
```

### 20. **Recovery Model**
Predicts patient recovery outcomes
- **CSV**: `patient_outcome_data.csv`
- **Output**: `recovery_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_recovery_model()"
```

### 21. **Stay Duration Model**
Predicts hospital stay duration for patients
- **CSV**: `patient_outcome_data.csv`
- **Output**: `stay_duration_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_stay_duration_model()"
```

### 22. **Hospital Disease Forecast Model**
Forecasts disease prevalence in hospitals
- **CSV**: `hospital_disease_data.csv`
- **Output**: `hospital_disease_models.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_hospital_disease_forecast_model()"
```

### 23. **Inventory Prediction Model**
Predicts medical inventory needs (stock levels)
- **CSV**: `inventory_data.csv`
- **Output**: `inventory_prediction_model.joblib`
- **Command**:
```bash
cd server/ml
python -c "import ai_ml; ai_ml.train_inventory_model()"
```

---

## Using Models for Predictions

### Load and Use a Trained Model Example:
```python
import ai_ml

# For emergency classification
result = ai_ml.predict_emergency("Cardiac issue detected - patient has chest pain")

# For hospital recommendation
data = {
    "emergency_type": "cardiac_issue",
    "distance_km": 5.2,
    "traffic_level": 4,
    "hospital_rating": 4.8
}
result = ai_ml.predict_hospital_recommendation(data)

# For compatibility prediction
data = {
    "receiver_blood_type": "A+",
    "receiver_age": 45,
    "receiver_gender": "Male",
    "donor_blood_type": "O-",
    "donor_age": 30,
    "donor_gender": "Female",
    "organ_type": "Kidney",
    "location_distance": 50
}
result = ai_ml.predict_compatibility(data)
```

---

## Model Training Summary Table

| Model Name | CSV Data | Output File | Use Case |
|---|---|---|---|
| Emergency Classifier | 911_calls.csv | emergency_classifier.joblib | Classify emergency types |
| Compatibility | compatibility_data.csv | compatibility_model.joblib | Organ/blood matching |
| Hospital Recommendation | hospital_data.csv | hospital_recommendation_model.joblib | Route to best hospital |
| Health Risk | health_risk_data.csv | health_risk_model.joblib | Assess patient risk |
| Activity Cluster | user_activity_data.csv | activity_cluster_model.joblib | User activity patterns |
| Behavior Forecast | user_forecast_data.csv | behavior_forecast_model.joblib | Predict user behavior |
| Emergency Hotspot | emergency_hotspot_data.csv | emergency_hotspot_model.joblib | Identify hotspots |
| Outbreak Forecast | outbreak_data.csv | outbreak_forecast_models.joblib | Forecast disease spread |
| Emergency Severity | emergency_severity_data.csv | emergency_severity_model.joblib | Rate severity |
| Donor Availability | donor_availability_data.csv | donor_availability_model.joblib | Resource availability |
| Resource Allocation | (synthetic) | allocation_q_table.joblib | Optimal allocation |
| Policy Segmentation | policy_data.csv | policy_segmentation_model.joblib | Segment policies |
| Healthcare Performance | policy_data.csv | healthcare_performance_model.joblib | Performance metrics |
| Anomaly Detection | anomaly_data.csv | anomaly_detection_model.joblib | Detect anomalies |
| Hospital Severity | hospital_severity_data.csv | hospital_severity_model.joblib | Hospital severity |
| ETA | eta_data.csv | eta_model.joblib | Estimate arrival time |
| Bed Forecast | hospital_resource_data.csv | bed_forecast_model.joblib | Predict bed availability |
| Staff Allocation | staff_allocation_data.csv | staff_allocation_model.joblib | Optimize staffing |
| Hospital Performance | hospital_performance_data.csv | hospital_performance_model.joblib | Hospital metrics |
| Recovery | patient_outcome_data.csv | recovery_model.joblib | Predict recovery |
| Stay Duration | patient_outcome_data.csv | stay_duration_model.joblib | Estimate stay length |
| Hospital Disease Forecast | hospital_disease_data.csv | hospital_disease_models.joblib | Disease patterns |
| Inventory Prediction | inventory_data.csv | inventory_prediction_model.joblib | Stock management |

---

## Tips for Training

1. **Data Quality**: Ensure CSV files have proper headers and valid data
2. **Training Time**: Some models (like Prophet for forecasting) may take longer to train
3. **Memory**: For large datasets (like health_risk_data.csv with 8763 rows), ensure sufficient RAM
4. **Verification**: After training, verify models exist in the directory
5. **Errors**: Check that all required CSV files are present in the `/server/ml` directory

---

## Troubleshooting

### Model file not found error:
- Ensure you've run the training command for that specific model
- Verify the .joblib file exists in the server/ml directory

### ImportError: No module named 'prophet':
```bash
pip install prophet
```

### ImportError: No module named 'networkx':
```bash
pip install networkx
```

### CSV file not found:
- Ensure you're running commands from the server/ml directory
- Verify CSV files exist and have data

---

**Last Updated**: February 4, 2026
**Total Models**: 23
