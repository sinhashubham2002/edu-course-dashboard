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
  X
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
  
  // Column filters for expanded view
  const [departmentFilter, setDepartmentFilter] = useState<{[college: string]: string}>({});
  const [semesterFilter, setSemesterFilter] = useState<{[college: string]: string}>({});
  const [courseNameFilter, setCourseNameFilter] = useState<{[college: string]: string}>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<{college: string, column: string} | null>(null);

  // Modal form state
  const [modalForm, setModalForm] = useState({
    college: '',
    semester: '',
    courseName: '',
    department: ''
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
    const newExpanded = new Set(expandedColleges);
    if (newExpanded.has(collegeName)) {
      newExpanded.delete(collegeName);
    } else {
      newExpanded.add(collegeName);
    }
    setExpandedColleges(newExpanded);
  };

  const handleRequest = (courseId: string) => {
    setCourses(prev => prev.map(course => 
      course.id === courseId 
        ? { ...course, requestCount: course.requestCount + 1 }
        : course
    ));
    setUserRequests(prev => new Set([...prev, courseId]));
  };

  const handleUnrequest = (courseId: string) => {
    if (userRequests.has(courseId)) {
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
    }
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
    // In a real app, this would submit to a backend
    console.log('Course request submitted:', modalForm);
    setIsModalOpen(false);
    setModalForm({ college: '', semester: '', courseName: '', department: '' });
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-foreground">Course Catalog</h1>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-3 rounded-lg shadow-elegant">
                <Plus className="h-5 w-5 mr-2" />
                Request a Course
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
                  <Select 
                    value={modalForm.college} 
                    onValueChange={(value) => setModalForm(prev => ({ ...prev, college: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a college" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(new Set(courses.map(c => c.college))).map(college => (
                        <SelectItem key={college} value={college}>{college}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Controls */}
        <Card className="p-6 mb-6 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-64">
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
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSort('name')}
                className={`${sortBy === 'name' ? 'bg-accent' : ''}`}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                College Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSort('requests')}
                className={`${sortBy === 'requests' ? 'bg-accent' : ''}`}
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Total Requests {sortBy === 'requests' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                className="w-full px-6 py-4 bg-card hover:bg-accent transition-colors text-left flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{collegeName}</h3>
                  <p className="text-muted-foreground mt-1">
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
                  {/* Column Headers */}
                  <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 border-b font-medium text-sm text-muted-foreground">
                    <div className="col-span-2">
                      {renderFilterableHeader(collegeName, 'department', 'Department')}
                    </div>
                    <div className="col-span-1">
                      {renderFilterableHeader(collegeName, 'semester', 'Sem')}
                    </div>
                    <div className="col-span-3">
                      {renderFilterableHeader(collegeName, 'courseName', 'Course Name')}
                    </div>
                    <div className="col-span-3">Request Progress</div>
                    <div className="col-span-3">Actions</div>
                  </div>

                  {/* Course Rows */}
                  {getFilteredCourses(collegeCourses, collegeName).map(course => {
                    const progressPercentage = Math.min((course.requestCount / 25) * 100, 100);
                    const isComplete = course.requestCount >= 25;
                    const canUnrequest = userRequests.has(course.id);

                    return (
                      <div key={course.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-b-0 hover:bg-accent/50 transition-colors">
                        <div className="col-span-2 text-foreground">{course.department}</div>
                        <div className="col-span-1 text-foreground">{course.semester}</div>
                        <div className="col-span-3 text-foreground font-medium">{course.course}</div>
                        
                        {/* Progress Column */}
                        <div className="col-span-3">
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
                        </div>

                        {/* Actions Column */}
                        <div className="col-span-3">
                          {course.status === 'active' && (
                            <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                              <Book className="h-4 w-4 mr-2" />
                              Learn Now
                            </Button>
                          )}
                          
                          {course.status === 'progress' && (
                            <span className="text-info font-medium">In Pipeline</span>
                          )}
                          
                          {course.status === 'inactive' && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRequest(course.id)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 transition-all duration-200 shadow-md"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnrequest(course.id)}
                                disabled={!canUnrequest}
                                className="hover:bg-destructive hover:text-destructive-foreground disabled:opacity-50"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                className="hover:bg-info hover:text-info-foreground"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
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
    </div>
  );
};

export default CourseCatalog;
