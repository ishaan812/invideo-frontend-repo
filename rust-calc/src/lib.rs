use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn calculate(expression: &str) -> Result<f64, JsValue> {
    match meval::eval_str(expression) {
        Ok(result) => Ok(result),
        Err(e) => Err(JsValue::from_str(&format!("Error: {}", e))),
    }
}



