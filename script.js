        let currentStep = 1;
        let budgetData = {
            income: 0,
            categories: [],
            expenses: [],
            savingsGoal: '',
            targetAmount: 0,
            startDate: null,
            monthlyHistory: []
        };

        let pieChart, barChart;

        const essentialCategories = ['Food', 'Transport', 'Study Materials'];
        const lifestyleCategories = ['Entertainment', 'Shopping', 'Others'];

        function loadData() {
            const saved = localStorage.getItem('studentBudget');
            if (saved) {
                try {
                    budgetData = JSON.parse(saved);
                    if (budgetData.startDate) {
                        showDashboard();
                    }
                } catch (e) {
                    console.error('Error loading data:', e);
                }
            }
        }

        function saveData() {
            try {
                localStorage.setItem('studentBudget', JSON.stringify(budgetData));
            } catch (e) {
                console.error('Error saving data:', e);
                showToast('Error saving data. Your browser storage might be full.', 'warning');
            }
        }

        function nextStep() {
            if (currentStep === 1) {
                const income = parseFloat(document.getElementById('monthlyIncome').value);
                if (!income || income <= 0) {
                    showToast('Please enter a valid amount!', 'warning');
                    return;
                }
                budgetData.income = income;
                initializeCategories();
            } else if (currentStep === 2) {
                const categories = collectCategories();
                if (categories.length === 0) {
                    showToast('Please add at least one category!', 'warning');
                    return;
                }
                budgetData.categories = categories;
                showReview();
            } else if (currentStep === 3) {
                applyAutoDistribution();
            }

            currentStep++;
            updateWizard();
            saveData();
        }

        function prevStep() {
            if (currentStep > 1) {
                currentStep--;
                updateWizard();
            }
        }

        function updateWizard() {
            document.querySelectorAll('.wizard-step').forEach(step => {
                step.classList.remove('active');
            });
            const activeStep = document.querySelector(`[data-step="${currentStep}"]`);
            if (activeStep) {
                activeStep.classList.add('active');
            }
            
            const progress = (currentStep / 4) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }

        function initializeCategories() {
            const container = document.getElementById('categoriesContainer');
            container.innerHTML = '';
            
            const defaultCategories = [
                { name: 'Food', type: 'essential' },
                { name: 'Transport', type: 'essential' },
                { name: 'Entertainment', type: 'lifestyle' },
                { name: 'Study Materials', type: 'essential' }
            ];
            
            defaultCategories.forEach(cat => {
                addCategory(cat.name, cat.type);
            });
        }

        function addCategory(name = '', type = 'essential') {
            const container = document.getElementById('categoriesContainer');
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <input type="text" placeholder="Category name" value="${name}" class="category-name">
                <input type="number" placeholder="Amount (₹)" min="0" class="category-amount">
                <select class="category-type">
                    <option value="essential" ${type === 'essential' ? 'selected' : ''}>Essential</option>
                    <option value="lifestyle" ${type === 'lifestyle' ? 'selected' : ''}>Lifestyle</option>
                </select>
                <button class="remove-btn" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(div);
        }

        function collectCategories() {
            const items = document.querySelectorAll('.category-item');
            const categories = [];
            
            items.forEach(item => {
                const name = item.querySelector('.category-name').value.trim();
                const amount = parseFloat(item.querySelector('.category-amount').value) || 0;
                const type = item.querySelector('.category-type').value;
                
                if (name && amount > 0) {
                    categories.push({ name, amount, type, spent: 0 });
                }
            });
            
            return categories;
        }

        function showReview() {
            const container = document.getElementById('reviewContainer');
            let html = '<h3>Your Budget Summary</h3>';
            
            html += `<div class="review-item">
                <span class="label"><i class="fas fa-wallet"></i> Monthly Income:</span>
                <span class="value">₹${budgetData.income.toFixed(0)}</span>
            </div>`;
            
            let totalPlanned = 0;
            budgetData.categories.forEach(cat => {
                totalPlanned += cat.amount;
                const icon = cat.type === 'essential' ? 'fas fa-check-circle' : 'fas fa-star';
                html += `<div class="review-item">
                    <span class="label"><i class="${icon}"></i> ${cat.name} (${cat.type}):</span>
                    <span class="value">₹${cat.amount.toFixed(0)}</span>
                </div>`;
            });
            
            const remaining = budgetData.income - totalPlanned;
            html += `<div class="review-item" style="border-top: 2px solid #10b981; margin-top: 10px; padding-top: 15px;">
                <span class="label"><i class="fas fa-piggy-bank"></i> Planned Savings:</span>
                <span class="value" style="color: ${remaining >= 0 ? '#10b981' : '#ef4444'}">₹${remaining.toFixed(0)}</span>
            </div>`;
            
            container.innerHTML = html;
        }

        function applyAutoDistribution() {
            const income = budgetData.income;
            const essentialBudget = income * 0.5;
            const lifestyleBudget = income * 0.3;
            const savingsBudget = income * 0.2;
            
            let essentialCount = budgetData.categories.filter(c => c.type === 'essential').length;
            let lifestyleCount = budgetData.categories.filter(c => c.type === 'lifestyle').length;
            
            if (essentialCount === 0) essentialCount = 1;
            if (lifestyleCount === 0) lifestyleCount = 1;
            
            budgetData.categories = budgetData.categories.map(cat => {
                if (cat.type === 'essential') {
                    cat.budget = essentialBudget / essentialCount;
                } else {
                    cat.budget = lifestyleBudget / lifestyleCount;
                }
                return cat;
            });
            
            budgetData.suggestedSavings = savingsBudget;
        }

        function completeBudget() {
            const goal = document.getElementById('savingsGoal').value.trim();
            const target = parseFloat(document.getElementById('targetAmount').value) || 0;
            
            if (!goal) {
                showToast('Please enter what you\'re saving for!', 'warning');
                return;
            }
            
            budgetData.savingsGoal = goal;
            budgetData.targetAmount = target;
            budgetData.startDate = new Date().toISOString();
            budgetData.expenses = budgetData.expenses || [];
            
            saveData();
            showDashboard();
            showToast('Budget setup complete! Start tracking your expenses', 'success');
        }

        function showDashboard() {
            document.getElementById('wizard').style.display = 'none';
            document.getElementById('dashboard').classList.add('active');
            
            populateExpenseCategories();
            updateDashboard();
            initCharts();
            checkBadges();
        }

        function populateExpenseCategories() {
            const select = document.getElementById('expenseCategory');
            if (budgetData.categories && budgetData.categories.length > 0) {
                select.innerHTML = budgetData.categories.map(cat => 
                    `<option value="${cat.name}">${cat.name}</option>`
                ).join('');
            }
        }

        function addExpense() {
            const amount = parseFloat(document.getElementById('expenseAmount').value);
            const category = document.getElementById('expenseCategory').value;
            const description = document.getElementById('expenseDescription').value.trim();
            
            if (!amount || amount <= 0) {
                showToast('Please enter a valid amount!', 'warning');
                return;
            }
            
            if (!category) {
                showToast('Please select a category!', 'warning');
                return;
            }
            
            const expense = {
                amount,
                category,
                description,
                date: new Date().toISOString()
            };
            
            budgetData.expenses.push(expense);
            
            const cat = budgetData.categories.find(c => c.name === category);
            if (cat) {
                cat.spent = (cat.spent || 0) + amount;
            }
            
            saveData();
            updateDashboard();
            
            document.getElementById('expenseAmount').value = '';
            document.getElementById('expenseDescription').value = '';
            
            checkOverspending(category, amount);
            checkPredictions();
            checkBadges();
            
            showToast(`Added ₹${amount} to ${category}`, 'success');
        }

        function checkOverspending(category, amount) {
            const cat = budgetData.categories.find(c => c.name === category);
            if (!cat) return;
            
            const percentUsed = (cat.spent / cat.budget) * 100;
            
            if (cat.type === 'lifestyle' && amount > 500) {
                const messages = [
                    `₹${amount} on ${category}? Your future self just facepalmed`,
                    `Wow, ₹${amount} for ${category}. Living the high life, aren't we?`,
                    `₹${amount} on ${category}? Hope it was worth the instant noodles later`,
                    `${category} for ₹${amount}? Bold move. Your wallet is crying`,
                    `₹${amount}? Someone's feeling fancy today. Budget says hi from the corner`
                ];
                setTimeout(() => {
                    showToast(messages[Math.floor(Math.random() * messages.length)], 'warning');
                }, 300);
            }
            
            if (percentUsed > 80 && percentUsed <= 100) {
                setTimeout(() => {
                    showToast(`You've used ${percentUsed.toFixed(0)}% of your ${category} budget. Easy there!`, 'warning');
                }, 600);
            } else if (percentUsed > 100) {
                setTimeout(() => {
                    showToast(`Uh oh! You've exceeded your ${category} budget by ₹${(cat.spent - cat.budget).toFixed(0)}`, 'warning');
                }, 600);
            }
        }

        function checkPredictions() {
            const today = new Date();
            const startDate = new Date(budgetData.startDate);
            const daysElapsed = Math.max(1, Math.floor((today - startDate) / (1000 * 60 * 60 * 24)));
            const daysInMonth = 30;
            
            const totalSpent = budgetData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const dailyAverage = totalSpent / daysElapsed;
            const projectedSpending = dailyAverage * daysInMonth;
            
            const percentOfMonth = (daysElapsed / daysInMonth) * 100;
            const percentSpent = (totalSpent / budgetData.income) * 100;
            
            const warnings = [];
            
            if (percentSpent > percentOfMonth + 20 && daysElapsed > 3) {
                warnings.push({
                    title: 'Spending Too Fast!',
                    icon: 'fas fa-exclamation-triangle',
                    message: `You've spent ${percentSpent.toFixed(0)}% of your budget in ${percentOfMonth.toFixed(0)}% of the month.`,
                    prediction: `At this rate, you'll spend ₹${projectedSpending.toFixed(0)} this month (${((projectedSpending/budgetData.income)*100).toFixed(0)}% of income).`
                });
            }
            
            if (projectedSpending > budgetData.income && daysElapsed > 3) {
                const daysUntilBroke = Math.floor(budgetData.income / dailyAverage);
                warnings.push({
                    title: 'Money Running Out Alert!',
                    icon: 'fas fa-fire',
                    message: `Your current spending pattern suggests you'll run out of money by day ${daysUntilBroke} of the month.`,
                    prediction: 'Consider cutting back on non-essential spending immediately!'
                });
            }
            
            const warningContainer = document.getElementById('warningContainer');
            if (warnings.length > 0) {
                warningContainer.innerHTML = warnings.map(w => `
                    <div class="warning-card">
                        <h4><i class="${w.icon}"></i> ${w.title}</h4>
                        <p>${w.message}</p>
                        <p><strong>${w.prediction}</strong></p>
                    </div>
                `).join('');
            } else {
                warningContainer.innerHTML = '';
            }
        }

        function updateDashboard() {
            const totalSpent = budgetData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const remaining = budgetData.income - totalSpent;
            const savingsProgress = budgetData.targetAmount > 0 ? 
                Math.min(100, (remaining / budgetData.targetAmount) * 100) : 0;
            
            document.getElementById('statIncome').textContent = `₹${budgetData.income.toFixed(0)}`;
            document.getElementById('statSpent').textContent = `₹${totalSpent.toFixed(0)}`;
            document.getElementById('statRemaining').textContent = `₹${remaining.toFixed(0)}`;
            document.getElementById('statSavings').textContent = `${savingsProgress.toFixed(0)}%`;
            
            updateExpenseList();
            updateCharts();
        }

        function updateExpenseList() {
            const list = document.getElementById('expenseList');
            const expenses = [...budgetData.expenses].reverse();
            
            if (expenses.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No expenses yet. Start tracking!</p>
                    </div>
                `;
                return;
            }
            
            list.innerHTML = expenses.map((exp, index) => {
                const cat = budgetData.categories.find(c => c.name === exp.category);
                const icon = cat && cat.type === 'essential' ? 'fas fa-check-circle' : 'fas fa-star';
                
                return `
                    <div class="expense-item">
                        <div class="info">
                            <strong><i class="${icon}"></i> ${exp.category}</strong>
                            ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
                            <div class="date"><i class="far fa-calendar"></i> ${new Date(exp.date).toLocaleDateString()}</div>
                        </div>
                        <span class="amount">₹${exp.amount.toFixed(0)}</span>
                        <button class="remove-btn" onclick="removeExpense(${budgetData.expenses.length - 1 - index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }

        function removeExpense(index) {
            if (index < 0 || index >= budgetData.expenses.length) return;
            
            const expense = budgetData.expenses[index];
            const cat = budgetData.categories.find(c => c.name === expense.category);
            if (cat) {
                cat.spent = Math.max(0, (cat.spent || 0) - expense.amount);
            }
            
            budgetData.expenses.splice(index, 1);
            saveData();
            updateDashboard();
            checkBadges();
            
            showToast('Expense removed', 'success');
        }

        function initCharts() {
            const pieCtx = document.getElementById('pieChart');
            const barCtx = document.getElementById('barChart');
            
            if (!pieCtx || !barCtx) return;
            
            pieChart = new Chart(pieCtx.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#10b981', '#059669', '#34d399', '#6ee7b7',
                            '#a7f3d0', '#d1fae5', '#f59e0b', '#f97316'
                        ],
                        borderColor: '#1a1a1a',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e0e0e0',
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#10b981',
                            bodyColor: '#e0e0e0',
                            borderColor: '#2a2a2a',
                            borderWidth: 1,
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ₹${context.parsed.toFixed(0)}`;
                                }
                            }
                        }
                    }
                }
            });
            
            barChart = new Chart(barCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Remaining Budget',
                        data: [],
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    }, {
                        label: 'Spent',
                        data: [],
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        x: {
                            stacked: true,
                            grid: {
                                color: '#2a2a2a'
                            },
                            ticks: {
                                color: '#9ca3af'
                            }
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: {
                                color: '#2a2a2a'
                            },
                            ticks: {
                                color: '#9ca3af',
                                callback: function(value) {
                                    return '₹' + value;
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: '#e0e0e0',
                                padding: 15,
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            backgroundColor: '#1a1a1a',
                            titleColor: '#10b981',
                            bodyColor: '#e0e0e0',
                            borderColor: '#2a2a2a',
                            borderWidth: 1,
                            padding: 12,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ₹${context.parsed.y.toFixed(0)}`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function updateCharts() {
            if (!pieChart || !barChart) return;
            
            const categories = budgetData.categories;
            const labels = categories.map(c => c.name);
            const spent = categories.map(c => c.spent || 0);
            const remaining = categories.map(c => Math.max(0, (c.budget || 0) - (c.spent || 0)));
            
            pieChart.data.labels = labels;
            pieChart.data.datasets[0].data = spent;
            pieChart.update();
            
            barChart.data.labels = labels;
            barChart.data.datasets[0].data = remaining;
            barChart.data.datasets[1].data = spent;
            barChart.update();
        }

        function checkBadges() {
            const totalSpent = budgetData.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const remaining = budgetData.income - totalSpent;
            const savingsPercent = (remaining / budgetData.income) * 100;
            
            const badges = [
                { name: 'Saver Novice', icon: 'fas fa-seedling', earned: savingsPercent >= 5, threshold: 5 },
                { name: 'Budget Master', icon: 'fas fa-gem', earned: savingsPercent >= 20, threshold: 20 },
                { name: 'Savings Champion', icon: 'fas fa-trophy', earned: savingsPercent >= 30, threshold: 30 }
            ];
            
            const badgeDisplay = document.getElementById('badgeDisplay');
            badgeDisplay.innerHTML = badges.map((badge, idx) => `
                <div class="badge ${badge.earned ? 'earned' : ''}" title="${badge.earned ? 'Unlocked!' : `Save ${badge.threshold}% to unlock`}">
                    <i class="${badge.icon}"></i>
                    ${badge.name}
                    ${!badge.earned ? `<span style="opacity: 0.7; font-size: 0.85em">(${badge.threshold}%)</span>` : ''}
                </div>
            `).join('');
            
            badges.forEach((badge, index) => {
                const badgeKey = `badge${index}Shown`;
                if (badge.earned && !budgetData[badgeKey]) {
                    setTimeout(() => {
                        showToast(`Achievement Unlocked: ${badge.name}!`, 'success');
                    }, 500);
                    budgetData[badgeKey] = true;
                    saveData();
                }
            });
        }

        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
            
            toast.innerHTML = `
                <i class="${icon}"></i>
                <div>${message}</div>
            `;
            toast.className = `toast ${type} show`;
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 5000);
        }

        function resetBudget() {
            if (confirm('Are you sure you want to reset your budget? All data will be lost!')) {
                localStorage.removeItem('studentBudget');
                location.reload();
            }
        }

        // Initialize on load
        loadData();
   