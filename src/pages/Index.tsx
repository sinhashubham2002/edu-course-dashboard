import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus, 
  Share2, 
  Book, 
  Search,
  ArrowUpDown,
  X,
  Copy,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

// Course interface
interface Course {
  college: string;
  semester: number;
  course: string;
  department: string;
  requestCount: number;
  status: 'active' | 'progress' | 'inactive';
  id: string;
}

// User interface
interface User {
  id: string;
  name: string;
  email: string;
}

// Mock data
const mockCourses: Course[] = [
  { id: '1', college: 'Stanford University', semester: 1, course: 'Introduction to AI', department: 'Computer Science', requestCount: 18, status: 'inactive' },
  { id: '2', college: 'Stanford University', semester: 2, course: 'Machine Learning', department: 'Computer Science', requestCount: 25, status: 'active' },
  { id: '3', college: 'Stanford University', semester: 1, course: 'Data Structures', department: 'Computer Science', requestCount: 12, status: 'progress' },
  { id: '4', college: 'MIT', semester: 1, course: 'Calculus I', department: 'Mathematics', requestCount: 22, status: 'inactive' },
  { id: '5', college: 'MIT', semester: 2, course: 'Physics I', department: 'Physics', requestCount: 15, status: 'active' },
  { id: '6', college: 'MIT', semester: 1, course: 'Chemistry Basics', department: 'Chemistry', requestCount: 8, status: 'inactive' },
  { id: '7', college: 'Harvard University', semester: 1, course: 'Psychology 101', department: 'Psychology', requestCount: 30, status: 'active' },
  { id: '8', college: 'Harvard University', semester: 2, course: 'Business Ethics', department: 'Business', requestCount: 14, status: 'progress' },
  { id: '9', college: 'Harvard University', semester: 1, course: 'Philosophy of Mind', department: 'Philosophy', requestCount: 7, status: 'inactive' },
  { id: '10', college: 'UC Berkeley', semester: 1, course: 'Environmental Science', department: 'Environmental Studies', requestCount: 19, status: 'inactive' },
  { id: '11', college: 'UC Berkeley', semester: 2, course: 'Organic Chemistry', department: 'Chemistry', requestCount: 26, status: 'active' },
  { id: '12', college: 'UC Berkeley', semester: 1, course: 'Linear Algebra', department: 'Mathematics', requestCount: 11, status: 'progress' },
  { id: '13', college: 'Princeton University', semester: 1, course: 'Art History', department: 'Art', requestCount: 9, status: 'inactive' },
  { id: '14', college: 'Princeton University', semester: 2, course: 'Economics 101', department: 'Economics', requestCount: 23, status: 'active' },
  { id: '15', college: 'Princeton University', semester: 1, course: 'Creative Writing', department: 'English', requestCount: 16, status: 'progress' }
];

const CourseCatalog = () => {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());
  const [collegeFilter, setCollegeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'requests'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [userRequests, setUserRequests] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareModalCourse, setShareModalCourse] = useState<Course | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const { toast } = useToast();
  
  // Column filters for expanded view
  const [departmentFilter, setDepartmentFilter] = useState<{[college: string]: string}>({});
  const [semesterFilter, setSemesterFilter] = useState<{[college: string]: string}>({});
  const [courseNameFilter, setCourseNameFilter] = useState<{[college: string]: string}>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<{college: string, column: string} | null>(null);

  // Modal form states
  const [modalForm, setModalForm] = useState({
    college: '',
    semester: '',
    courseName: '',
    department: ''
  });

  // College autocomplete state
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  
  // Get filtered college suggestions
  const getCollegeSuggestions = () => {
    if (!modalForm.college) return [];
    return Array.from(new Set(courses.map(c => c.college)))
      .filter(college => 
        college.toLowerCase().includes(modalForm.college.toLowerCase()) &&
        college.toLowerCase() !== modalForm.college.toLowerCase()
      )
      .slice(0, 5); // Limit to 5 suggestions
  };

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Get unique colleges and their data
  const collegeData = useMemo(() => {
    const filtered = courses.filter(course => 
      course.college.toLowerCase().includes(collegeFilter.toLowerCase())
    );
    
    const grouped = filtered.reduce((acc, course) => {
      if (!acc[course.college]) {
        acc[course.college] = [];
      }
      acc[course.college].push(course);
      return acc;
    }, {} as Record<string, Course[]>);

    const collegeList = Object.entries(grouped).map(([college, collegeCourses]) => ({
      name: college,
      courses: collegeCourses,
      totalRequests: collegeCourses.reduce((sum, course) => sum + course.requestCount, 0)
    }));

    // Sort colleges
    collegeList.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else {
        return sortOrder === 'asc' 
          ? a.totalRequests - b.totalRequests
          : b.totalRequests - a.totalRequests;
      }
    });

    return collegeList;
  }, [courses, collegeFilter, sortBy, sortOrder]);

  const toggleCollege = (collegeName: string) => {
    const newExpanded = new Set<string>();
    if (!expandedColleges.has(collegeName)) {
      newExpanded.add(collegeName);
    }
    setExpandedColleges(newExpanded);
  };

  const handleRequest = (courseId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const hasRequested = userRequests.has(courseId);
    
    if (hasRequested) {
      // Withdraw request
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, requestCount: Math.max(0, course.requestCount - 1) }
          : course
      ));
      setUserRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
      toast({
        title: "Request withdrawn",
        description: "Your course request has been withdrawn.",
      });
    } else {
      // Add request
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, requestCount: course.requestCount + 1 }
          : course
      ));
      setUserRequests(prev => new Set([...prev, courseId]));
      toast({
        title: "Course requested!",
        description: "Your request has been added successfully.",
      });
    }
  };

  const handleShare = (course: Course) => {
    setShareModalCourse(course);
    setIsShareModalOpen(true);
  };

  const copyToClipboard = () => {
    if (shareModalCourse) {
      let message = '';
      
      if (shareModalCourse.status === 'active') {
        message = `Share this with your friend and start learning together! "${shareModalCourse.course}" at ${shareModalCourse.college} is now active with ${shareModalCourse.requestCount} requests. Join me: ${window.location.href}`;
      } else {
        message = `Help me request "${shareModalCourse.course}" at ${shareModalCourse.college}! We need 25 requests to make this course happen. Currently at ${shareModalCourse.requestCount}/25 requests. Join me: ${window.location.href}`;
      }
      
      navigator.clipboard.writeText(message).then(() => {
        toast({
          title: "Message copied!",
          description: "Course request message has been copied to clipboard.",
        });
      });
    }
  };

  const handleNativeShare = () => {
    if (navigator.share && shareModalCourse) {
      let shareText = '';
      
      if (shareModalCourse.status === 'active') {
        shareText = `Share this with your friend and start learning together! "${shareModalCourse.course}" at ${shareModalCourse.college} is now active with ${shareModalCourse.requestCount} requests.`;
      } else {
        shareText = `Help me request "${shareModalCourse.course}" at ${shareModalCourse.college}! We need 25 requests to make this course happen. Currently at ${shareModalCourse.requestCount}/25 requests.`;
      }
      
      navigator.share({
        title: `${shareModalCourse.status === 'active' ? 'Join' : 'Request'} ${shareModalCourse.course}`,
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    }
  };

  const handleAuth = () => {
    if (authMode === 'signin') {
      // Mock signin
      const mockUser = { id: '1', name: 'John Doe', email: authForm.email };
      setCurrentUser(mockUser);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
    } else {
      // Mock signup
      const mockUser = { id: '1', name: authForm.name, email: authForm.email };
      setCurrentUser(mockUser);
      toast({
        title: "Account created!",
        description: "Welcome to Course Catalog!",
      });
    }
    setIsAuthModalOpen(false);
    setAuthForm({ name: '', email: '', password: '' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserRequests(new Set());
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const getFilteredCourses = (collegeCourses: Course[], collegeName: string) => {
    return collegeCourses.filter(course => {
      const deptFilter = departmentFilter[collegeName] || '';
      const semFilter = semesterFilter[collegeName] || '';
      const courseFilter = courseNameFilter[collegeName] || '';
      
      return (
        course.department.toLowerCase().includes(deptFilter.toLowerCase()) &&
        course.semester.toString().includes(semFilter) &&
        course.course.toLowerCase().includes(courseFilter.toLowerCase())
      );
    });
  };

  const handleSort = (type: 'name' | 'requests') => {
    if (sortBy === type) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  const handleModalSubmit = () => {
    console.log('Course request submitted:', modalForm);
    setIsModalOpen(false);
    setModalForm({ college: '', semester: '', courseName: '', department: '' });
    toast({
      title: "Course request submitted!",
      description: "We'll review your request and get back to you soon.",
    });
  };

  const handleFilterClick = (college: string, column: string) => {
    setActiveFilterColumn({ college, column });
  };

  const handleFilterChange = (college: string, column: string, value: string) => {
    if (column === 'department') {
      setDepartmentFilter(prev => ({ ...prev, [college]: value }));
    } else if (column === 'semester') {
      setSemesterFilter(prev => ({ ...prev, [college]: value }));
    } else if (column === 'courseName') {
      setCourseNameFilter(prev => ({ ...prev, [college]: value }));
    }
  };

  const clearFilter = (college: string, column: string) => {
    handleFilterChange(college, column, '');
    setActiveFilterColumn(null);
  };

  const renderFilterableHeader = (college: string, column: string, title: string) => {
    const isActive = activeFilterColumn?.college === college && activeFilterColumn?.column === column;
    
    if (isActive) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={
              column === 'department' ? departmentFilter[college] || '' :
              column === 'semester' ? semesterFilter[college] || '' :
              courseNameFilter[college] || ''
            }
            onChange={(e) => handleFilterChange(college, column, e.target.value)}
            placeholder={`Filter ${title.toLowerCase()}...`}
            className="h-8 text-sm"
            autoFocus
            onBlur={() => setActiveFilterColumn(null)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setActiveFilterColumn(null);
              }
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearFilter(college, column)}
            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <button
        onClick={() => handleFilterClick(college, column)}
        className="flex items-center gap-1 text-left hover:text-primary transition-colors"
      >
        {title}
        <Search className="h-3 w-3 opacity-50" />
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
              Course Catalog
            </h1>
            <p className="text-muted-foreground mt-2">Discover and request courses from top universities</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-foreground hidden sm:inline">Welcome, {currentUser.name}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsAuthModalOpen(true)} variant="outline">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-medium px-4 lg:px-6 py-3 rounded-lg shadow-elegant">
                  <Plus className="h-5 w-5 mr-2" />
                  <span className="hidden sm:inline">Request a Course</span>
                  <span className="sm:hidden">Request</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Request a New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      College Name
                    </label>
                    <div className="relative">
                      <Input
                        value={modalForm.college}
                        onChange={(e) => {
                          setModalForm(prev => ({ ...prev, college: e.target.value }));
                          setShowCollegeSuggestions(e.target.value.length > 0);
                        }}
                        onFocus={() => setShowCollegeSuggestions(modalForm.college.length > 0)}
                        onBlur={() => {
                          // Delay hiding suggestions to allow for clicks
                          setTimeout(() => setShowCollegeSuggestions(false), 200);
                        }}
                        placeholder="Type college name..."
                        className="w-full"
                      />
                      
                      {/* Suggestions Dropdown */}
                      {showCollegeSuggestions && getCollegeSuggestions().length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {getCollegeSuggestions().map((college) => (
                            <button
                              key={college}
                              type="button"
                              onClick={() => {
                                setModalForm(prev => ({ ...prev, college }));
                                setShowCollegeSuggestions(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0"
                            >
                              {college}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Semester
                    </label>
                    <Select 
                      value={modalForm.semester} 
                      onValueChange={(value) => setModalForm(prev => ({ ...prev, semester: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Semester 1</SelectItem>
                        <SelectItem value="2">Semester 2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Course Name
                    </label>
                    <Input
                      value={modalForm.courseName}
                      onChange={(e) => setModalForm(prev => ({ ...prev, courseName: e.target.value }))}
                      placeholder="Enter course name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Department
                    </label>
                    <Input
                      value={modalForm.department}
                      onChange={(e) => setModalForm(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="Enter department"
                    />
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleModalSubmit}
                      className="flex-1"
                      disabled={!modalForm.college || !modalForm.semester || !modalForm.courseName || !modalForm.department}
                    >
                      Submit Request
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4 lg:p-6 mb-6 shadow-card">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter colleges..."
                  value={collegeFilter}
                  onChange={(e) => setCollegeFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => handleSort('name')}
                className={`${sortBy === 'name' ? 'bg-accent' : ''} text-sm`}
                size="sm"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">College Name</span>
                <span className="sm:hidden">Name</span>
                {sortBy === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSort('requests')}
                className={`${sortBy === 'requests' ? 'bg-accent' : ''} text-sm`}
                size="sm"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Total Requests</span>
                <span className="sm:hidden">Requests</span>
                {sortBy === 'requests' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
              </Button>
            </div>
          </div>
        </Card>

        {/* College List */}
        <div className="space-y-4">
          {collegeData.map(({ name: collegeName, courses: collegeCourses, totalRequests }) => (
            <Card key={collegeName} className="overflow-hidden shadow-card">
              {/* College Header */}
              <button
                onClick={() => toggleCollege(collegeName)}
                className="w-full px-4 lg:px-6 py-4 bg-card hover:bg-accent transition-colors text-left flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-foreground">{collegeName}</h3>
                  <p className="text-muted-foreground mt-1 text-sm lg:text-base">
                    Total requests: {totalRequests}
                  </p>
                </div>
                {expandedColleges.has(collegeName) ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>

              {/* Expanded Content */}
              {expandedColleges.has(collegeName) && (
                <div className="border-t">
                  {/* Mobile Filters */}
                  <div className="md:hidden p-4 border-b bg-muted/50">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Department..."
                        value={departmentFilter[collegeName] || ''}
                        onChange={(e) => handleFilterChange(collegeName, 'department', e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Semester..."
                        value={semesterFilter[collegeName] || ''}
                        onChange={(e) => handleFilterChange(collegeName, 'semester', e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder="Course..."
                        value={courseNameFilter[collegeName] || ''}
                        onChange={(e) => handleFilterChange(collegeName, 'courseName', e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-muted/50 border-b">
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                            {renderFilterableHeader(collegeName, 'department', 'Department')}
                          </th>
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                            {renderFilterableHeader(collegeName, 'semester', 'Semester')}
                          </th>
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">
                            {renderFilterableHeader(collegeName, 'courseName', 'Course Name')}
                          </th>
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">Course Status</th>
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">Request Progress</th>
                          <th className="text-left p-4 font-medium text-sm text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredCourses(collegeCourses, collegeName).map(course => {
                          const progressPercentage = Math.min((course.requestCount / 25) * 100, 100);
                          const isComplete = course.requestCount >= 25;
                          const hasRequested = userRequests.has(course.id);

                          return (
                            <tr key={course.id} className="border-b last:border-b-0 hover:bg-accent/50 transition-colors">
                              <td className="p-4 text-foreground text-sm">{course.department}</td>
                              <td className="p-4 text-foreground text-sm">{course.semester}</td>
                              <td className="p-4 text-foreground font-medium text-sm">{course.course}</td>
                              <td className="p-4">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                  course.status === 'active' ? 'bg-success/20 text-success' :
                                  course.status === 'progress' ? 'bg-info/20 text-info' :
                                  'bg-warning/20 text-warning'
                                }`}>
                                  {course.status === 'active' ? 'Active' :
                                   course.status === 'progress' ? 'In Pipeline' :
                                   'Request Needed'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="space-y-2 min-w-[120px]">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium text-foreground">
                                      {course.requestCount}/25
                                    </span>
                                  </div>
                                  <Progress 
                                    value={progressPercentage} 
                                    className={`h-2 ${isComplete ? 'bg-progress-complete/20' : 'bg-progress-incomplete/20'}`}
                                  />
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleRequest(course.id)}
                                    className={`transform hover:scale-105 transition-all duration-200 shadow-md ${
                                      hasRequested 
                                        ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                                        : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'
                                    }`}
                                  >
                                    {hasRequested ? 'Withdraw' : 'Request'}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleShare(course)}
                                    className="hover:bg-info hover:text-info-foreground"
                                  >
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  
                                  {course.status === 'active' && (
                                    <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                                      <Book className="h-4 w-4 mr-2" />
                                      Learn Now
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                   {/* Mobile Layout */}
                   <div className="md:hidden">
                     {getFilteredCourses(collegeCourses, collegeName).map(course => {
                       const progressPercentage = Math.min((course.requestCount / 25) * 100, 100);
                       const isComplete = course.requestCount >= 25;
                       const hasRequested = userRequests.has(course.id);

                       return (
                         <div key={course.id} className="border-b last:border-b-0 hover:bg-accent/50 transition-colors p-4 space-y-3">
                           <div className="flex justify-between items-start">
                             <div className="flex-1">
                               <h4 className="font-medium text-foreground">{course.course}</h4>
                               <p className="text-sm text-muted-foreground">{course.department} • Semester {course.semester}</p>
                               <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mt-1 ${
                                 course.status === 'active' ? 'bg-success/20 text-success' :
                                 course.status === 'progress' ? 'bg-info/20 text-info' :
                                 'bg-warning/20 text-warning'
                               }`}>
                                 {course.status === 'active' ? 'Active' :
                                  course.status === 'progress' ? 'In Pipeline' :
                                  'Request Needed'}
                               </span>
                             </div>
                           </div>
                           
                           {/* Mobile Progress */}
                           <div className="space-y-2">
                             <div className="flex justify-between text-sm">
                               <span className="text-muted-foreground">Progress</span>
                               <span className="font-medium text-foreground">
                                 {course.requestCount}/25
                               </span>
                             </div>
                             <Progress 
                               value={progressPercentage} 
                               className={`h-2 ${isComplete ? 'bg-progress-complete/20' : 'bg-progress-incomplete/20'}`}
                             />
                           </div>

                            {/* Mobile Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleRequest(course.id)}
                                className={`transform hover:scale-105 transition-all duration-200 shadow-md flex-1 ${
                                  hasRequested 
                                    ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' 
                                    : 'bg-gradient-primary hover:opacity-90 text-primary-foreground'
                                }`}
                              >
                                {hasRequested ? 'Withdraw' : 'Request'}
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShare(course)}
                                className="hover:bg-info hover:text-info-foreground"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                              
                              {course.status === 'active' && (
                                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                                  <Book className="h-4 w-4 mr-2" />
                                  Learn Now
                                </Button>
                              )}
                            </div>
                         </div>
                       );
                     })}
                   </div>
                  
                  {getFilteredCourses(collegeCourses, collegeName).length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">
                      No courses match the current filters.
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
          
          {collegeData.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No colleges found matching your search.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <Dialog open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {authMode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={authForm.name}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleAuth}
                className="flex-1 bg-gradient-primary hover:opacity-90"
                disabled={!authForm.email || !authForm.password || (authMode === 'signup' && !authForm.name)}
              >
                {authMode === 'signin' ? (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                className="text-sm text-primary hover:underline"
              >
                {authMode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Share this with your friends and classmates to request this course. 
              We will create this course once the request count reaches 25!
            </p>
            
            {shareModalCourse && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium text-foreground">{shareModalCourse.course}</h4>
                <p className="text-sm text-muted-foreground">
                  {shareModalCourse.college} • {shareModalCourse.department}
                </p>
                <p className="text-sm text-foreground mt-2">
                  Current requests: {shareModalCourse.requestCount}/25
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <Input 
                value={shareModalCourse ? (
                  shareModalCourse.status === 'active' 
                    ? `Share this with your friend and start learning together! "${shareModalCourse.course}" at ${shareModalCourse.college} is now active with ${shareModalCourse.requestCount} requests. Join me: ${window.location.href}`
                    : `Help me request "${shareModalCourse.course}" at ${shareModalCourse.college}! We need 25 requests to make this course happen. Currently at ${shareModalCourse.requestCount}/25 requests. Join me: ${window.location.href}`
                ) : window.location.href}
                readOnly 
                className="flex-1"
              />
              <Button onClick={copyToClipboard} size="icon" variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            {navigator.share && (
              <Button 
                onClick={handleNativeShare} 
                className="w-full" 
                variant="outline"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share via Apps
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseCatalog;
