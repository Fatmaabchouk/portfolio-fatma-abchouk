-- Create portfolio_data table to store chatbot information
CREATE TABLE IF NOT EXISTS public.portfolio_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read
CREATE POLICY "Anyone can read portfolio data"
ON public.portfolio_data
FOR SELECT
USING (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Authenticated users can update portfolio data"
ON public.portfolio_data
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Authenticated users can insert portfolio data"
ON public.portfolio_data
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_data_updated_at
BEFORE UPDATE ON public.portfolio_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial portfolio data
INSERT INTO public.portfolio_data (section, content) VALUES
('about', 'Fatma Abchouk is an AI/ML Engineer and Full Stack Developer specializing in data science, machine learning, and web development.'),
('skills', '- **Data Science & AI**: Python, TensorFlow, PyTorch, Machine Learning, Deep Learning, NLP, Computer Vision, Anaconda, Jupyter Notebooks
- **Full Stack Development**: React, Node.js, Express, MongoDB, JavaScript, TypeScript
- **Data Visualization**: Power BI, Tableau, Data Analysis
- **UI/UX Design**: Figma, Design Tools
- **Tools & Platforms**: Git, XAMPP, MySQL'),
('projects', '## Data Science & Power BI
1. **Power BI Dashboard Project**
   - Interactive Power BI dashboard with comprehensive business insights
   - Real-time KPI tracking and data visualization
   - Technologies: Power BI

2. **Data Analysis with Anaconda & Jupyter**
   - Data analysis projects using Python, Pandas, Matplotlib
   - Exploratory data analysis and visualization
   - Technologies: Python, Anaconda, Jupyter, Pandas, Matplotlib

## Full Stack Development

3. **TechHive Blogging Website**
   - Modern blogging website developed during Brainwave Matrix internship
   - Features: Home, Services, content management
   - GitHub: https://github.com/fatmaabchouk/brainmatrix_tache-2
   - Technologies: JavaScript, React.js

4. **Full Stack Food Delivery Website**
   - Complete food delivery platform with ordering system
   - Payment integration using Stripe
   - Real-time order tracking
   - GitHub: https://github.com/fatmaabchouk/Full-Stack-Food-Delivery-Website-In-React-JS-MongoDB-Express-Node-JS-Stripe
   - Technologies: React.js, MongoDB, Express, Node.js, Stripe

5. **Cosmetic Product E-Commerce**
   - E-commerce platform developed during Brainwave Matrix internship
   - Product catalog and order management
   - GitHub: https://github.com/fatmaabchouk/Brainwave_Matrix_Intern
   - Technologies: JavaScript, React, MongoDB

6. **Koffa - Fresh Products Delivery**
   - Fresh products delivery website with email notifications
   - File upload capabilities and order management
   - GitHub: https://github.com/fatmaabchouk/Koffa-Fresh-Products-Delivery-Website-
   - Technologies: JavaScript, Node.js, XAMPP, MySQL, Express.js, Nodemailer, Multer

7. **Client Management System**
   - Management application for tracking client lists
   - Visual alert system for client management
   - GitHub: https://github.com/fatmaabchouk/Client-Management-System-with-Alerts-JS-XAMPP-MySQL
   - Technologies: JavaScript, XAMPP, MySQL, HTML

## UI/UX Design Projects

8. **Koffa Website Design**
   - Complete website design for fresh products delivery platform
   - Intuitive ordering experience
   - GitHub: https://github.com/fatmaabchouk/Koffa-Website-Design-in-Figma-
   - Technologies: Figma

9. **Koffa Mobile App Design**
   - Mobile app design optimized for seamless mobile experience
   - GitHub: https://github.com/fatmaabchouk/Koffa-Mobile-App-Design-with-Figma-
   - Technologies: Figma

10. **Pixeo Homepage Design**
    - UI/UX design showcasing innovative digital solutions
    - GitHub: https://github.com/fatmaabchouk/UI-UX-Design-for-Pixeo-s-Homepage-
    - Technologies: Figma

11. **Family Farmhouse Email Design**
    - Email template design with modern and professional layout
    - GitHub: https://github.com/fatmaabchouk/Family-Farmhouse-Design-in-Figma-
    - Technologies: Figma

12. **Secure Login Page Design**
    - Secure login page with user authentication fields
    - Session management and modern security features
    - GitHub: https://github.com/fatmaabchouk/Secure-Login-Page-for-the-company-Frontend
    - Technologies: HTML, CSS')
ON CONFLICT (section) DO NOTHING;