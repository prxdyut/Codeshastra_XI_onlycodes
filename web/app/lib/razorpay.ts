interface RazorpayOptions {
  key: string;
  amount: string;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

/**
 * Dynamically loads the Razorpay checkout.js script
 * @returns {Promise<void>} Resolves when script is loaded
 */
export function loadRazorpay(): Promise<void> {  
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        // Not in browser environment
        reject(new Error('Razorpay can only be loaded in the browser'));
        return;
      }
  
      if (window.Razorpay) {
        // Razorpay is already loaded
        resolve();
        return;
      }
  
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.Razorpay) {
          resolve();
        } else {
          reject(new Error('Razorpay failed to load'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };
  
      document.body.appendChild(script);
    });
  }
  
  /**
   * Creates a Razorpay payment instance
   * @param {Object} options - Razorpay options
   * @returns {Promise<Object>} Razorpay payment response
   */
  export async function initiateRazorpayPayment(options: RazorpayOptions) : Promise<RazorpayResponse> {
    try {
      await loadRazorpay();
      
      return new Promise((resolve, reject) => {
        const rzp = new window.Razorpay({
          ...options,
          handler: (response) => {
            resolve(response);
          },
          modal: {
            ondismiss: () => {
              reject(new Error('Payment window closed'));
            }
          }
        });
        
        rzp.open();
      });
    } catch (error) {
      throw error;
    }
  }