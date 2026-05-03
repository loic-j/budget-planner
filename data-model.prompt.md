/caveman your task now is to understand data model (database / domain) and relationships between data. you will generate docs based on the explanation i will gave you below

- each users can create 1 or multiple budgets (they will be admin of the budget)
- each users can invite with invite link other members to join to view / edit budget. They can remove users any time as well
- about budget data (used to calculate everything) users can
  - Manage meta data for the budget
    - set budget start date / end date (default = 100 years)
    - set currency to use
    - add / remove / edit persons
    - each persons will have sex, age and name
    - add / remove childs (planned date of birth or date of birth if already born, sex, name)
    - Initial saving
  - Manage expenses
    - Their is different types of expenses
      - Loan reimbursement
        - User will set total amount to load
        - User will set other important information for load calculation (interrest, duration, ...)
        - User will set start loan date
        - system will generate automatically how much user must reimburse every month and save it in related database
        - Loan reimbursement will have specific icon
      - Regular Expense
        - Set category (optional)
          - Preset categories:
            - Food
            - Housing
            - Transportation
            - Entertainment
            - Health
            - Personal care
            - Travel
            - Gift
            - Education - kindergarten
            - Education - primary school
            - Education - junior high school
            - Education - high school
            - University
            - Other
          - User can add categories
          - Each expenses categories will have specific icon
        - Set start / end date (only for recurring expenses)
        - Set amount
        - recurring frequency (one time, monthly, yearly, every X month, every X year, ..)
        - Set name
        - User can set multiple recurring expenses in same screen at once
      - Feel free to propose anythingelse you think is relevant for a expenses
  - Manage revenue
    - Details
      - Set Category (optional)
        - Preset categories:
          - Salary
          - Freelance
          - Pension
          - Unemployment benefit
          - Other
        - User can add categories
        - Each revenue categories will have specific icon
      - Set amount
      - Set recurring frequency (one time, monthly, yearly, every X month, every X year, ...)
      - Set start / end date (only for recurring revenue)
      - Set name
      - Attach to a person (optional)
      - User can set multiple revenues in same screen at once (in same screen as one time revenue)
    - Feel free to propose anythingelse you think is relevant for a revenues
  - Manage saving
    - Details
      - Set Category (optional)
        - Preset categories:
          - Emergency fund
          - Retirement
          - Other
        - User can add categories
        - Each saving categories will have specific icon
      - Set amount
      - Set recurring frequency (one time, monthly, yearly, every X month, every X year, ...)
      - Set start / end date (only for recurring saving)
      - Set name
      - Attach to a person (optional)
      - User can set multiple savings in same screen at once (in same screen as one time saving)
    - Feel free to propose anythingelse you think is relevant for a saving

Ask me if there is anything you want to clarify about the data model or if you want me to generate the docs based on this explanation.

---

Now please design the screens for the application based on the data model and requirements you have provided. Consider the user flow and how users will interact with the different features of the application. You will create 1 or multiple docs for screen design and explain basic features in them. You can also propose any additional features or improvements that you think would enhance the user experience.

Doc must contains

- List of all screens
- Design screen transitions
- For each screen create seperate doc with
  - Visual representation of each screen (you can use ASCII art or any other method to represent the layout and elements of the screen)
  - Description of the features and functionalities available on the screen
  - Explanation of how users will interact with the screen and its elements
  - Any additional features or improvements you propose for that screen

FYI, here is some details for expenses, revenues, savings, assets screens:

- you will show in real time (when user edit) a graph with evolution the current money data over time (for the budget start / end period)
  - dynamic graph displayed at the top of the screen
  - edit / add /remove data at the bottom of the screen

The site must be responsive and work on mobile and desktop. You can propose different layouts for mobile and desktop if you think it is relevant.

Also their will be a dashboard screen where users can see an overview of their budget, including total expenses, total revenues, total savings, and a graph showing the overall financial situation.

Also their will be a screen with detailed graph view (overall view) where Users can view with nice charts, graph the evolution of revenues / expenses / savings over times. It will shows all persons / child ages as well. All data will be visible in table as well. Feel free to propose any additional features or improvements for this screen as well.

You must think about good flexible diagram / chart display framework or tool to use for the graph display. It should be able to handle real-time updates and be visually appealing.

Ask me if there is anything you want to clarify about the data model or if you want me to generate the docs based on this explanation.
